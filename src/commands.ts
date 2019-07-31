import { Message, SendMessageOptions, CallbackQuery, EditMessageTextOptions, InlineQueryResultArticle } from './transports/telegram';
import { Attach } from './transports/jira';
import _ from 'lodash';
import { TranportObjects } from './app';
import { formatMessage, addDescription, getUsers, checkPermissions } from './helpers';


export async function enrichIssues(msg: Message, match: string[], transports: TranportObjects) {
  if (!checkPermissions(msg && msg.from && msg.from.username || '')) {
    return;
  }

  const { jira, telegram } = transports;

  telegram.sendChatAction(msg.chat.id, "typing");

  const { issues } = await jira.getIssues(match as Array<string>);

  if (!issues || !issues.length) {
    return;
  }

  const chatId = msg.chat.id;
  const resp = _.map(issues, formatMessage).join('\n\n');

  const options = {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_to_message_id: msg.message_id,
    reply_markup: {}
  };

  if (issues.length === 1) {
    options.reply_markup = {
      inline_keyboard: [[
        {
          text: `Show description`,
          callback_data: 'show_description'
        }
      ]]
    };
  }

  telegram.sendMessage(<number>chatId, <string>resp, <SendMessageOptions>options);
}

export async function createIssue(msg: Message, project: string, summary: string, assigner: string | undefined, transports: TranportObjects) {
  if (!checkPermissions(msg && msg.from && msg.from.username || '')) {
    return;
  }

  const { jira, telegram } = transports;
  
  telegram.sendChatAction(msg.chat.id, "typing");
  
  interface JiraNewIssue {
    fields: {
      project: {
        key: string
      },
      summary: string,
      description?: string,
      assignee?: {
        name: string
      },
      reporter?: {
        name: string
      },
      issuetype: {
        name: string
      }
    }
  }

  const issue: JiraNewIssue = {
    fields: {
      project: {
        key: project
      },
      summary,
      description: msg.reply_to_message && msg.reply_to_message.text || '',
      assignee: undefined,
      reporter: undefined,
      issuetype: {
        name: 'Task'
      }
    }
  };

  const users = getUsers();
  const user = users[<string>assigner];
  if (user) {
    issue.fields.assignee = {
      name: user
    };
  }

  const reporter = users[msg && msg.from && msg.from.username || ''];
  if (reporter) {
    issue.fields.reporter = {
      name: reporter
    };
  }
  
  const createdIssue = await jira.createIssue(issue);
  if (!createdIssue) {
    return;
  }

  const { issues } = await jira.getIssues([createdIssue.key] as Array<string>);
  if (!issues || !issues.length) {
    return;
  }

  const chatId = msg.chat.id;
  const resp = _.map(issues, formatMessage).join('\n\n');
  const options = {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_to_message_id: msg.message_id,
    reply_markup: {}
  };

  if (issues.length === 1) {
    options.reply_markup = {
      inline_keyboard: [[
        {
          text: `Show description`,
          callback_data: 'show_description'
        }
      ]]
    };
  }

  telegram.sendMessage(<number>chatId, <string>resp, <SendMessageOptions>options);
}

export async function createComment(msg: Message, issueKey: string, comment: string, transports: TranportObjects) {
  const telegramUsername = msg && msg.from && msg.from.username || '';
  const text = comment || (msg && msg.reply_to_message && (msg.reply_to_message.caption || msg.reply_to_message.text) || '');
  const photos = msg && msg.reply_to_message && msg.reply_to_message.photo || [];
  const document = msg && msg.reply_to_message && msg.reply_to_message.document;
  const audio = msg && msg.reply_to_message && msg.reply_to_message.audio;
  const video = msg && msg.reply_to_message && msg.reply_to_message.audio;
  const voice = msg && msg.reply_to_message && msg.reply_to_message.voice;
  const attaches = _.compact([
    ...photos,
    document,
    audio,
    video,
    voice
  ]);
  if (!text && !attaches.length) {
    return;
  }

  if (!checkPermissions(telegramUsername)) {
    return;
  }

  const users = getUsers();
  const username = users[<string>telegramUsername];

  const { jira, telegram } = transports;
  
  telegram.sendChatAction(msg.chat.id, "typing");

  const user = await jira.searchUser(username);
  if (!user) {
    return;
  }

  const { issues: foundIssues } = await jira.getIssues([issueKey]);
  if (!foundIssues || foundIssues.length === 0) {
    return;
  }

  const lastAttach = attaches[attaches.length - 1];
  const attachResult = await attachFile(issueKey, lastAttach && lastAttach.file_id, transports) || [];
  //  !file.jpg|thumbnail! 
  const stringAttaches = attachResult.map((item: Attach) => `\n!${item.filename}|thumbnail!`);

  const formattedComment = `*${user.displayName}* says:\n${text}\n${stringAttaches}`
  const createdComment = await jira.createComment(issueKey, formattedComment);
  if (!createdComment) {
    return;
  }

  const chatId = msg.chat.id;
  const resp = `The comment in <a href="https://${process.env.JIRA_HOSTNAME}/browse/${foundIssues[0].key}">${foundIssues[0].key} ${foundIssues[0].fields.summary}</a> is successfully added.`;
  const options = {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_to_message_id: msg.message_id,
    reply_markup: {}
  };

  telegram.sendMessage(<number>chatId, <string>resp, <SendMessageOptions>options);
}

export async function onKeyboardRequest(callbackQuery: CallbackQuery, match: string[], transports: TranportObjects) {
  if (!checkPermissions(callbackQuery && callbackQuery.from && callbackQuery.from.username || '')) {
    return;
  }
  
  const { jira, telegram } = transports;
  if (!callbackQuery.message) {
    return;
  }
  const { issues } = await jira.getIssues(match as Array<string>);
  if (!issues) {
    return;
  }
  const updatedMessage = addDescription(formatMessage(issues[0]), issues[0].fields.description);
  if (callbackQuery.data === 'show_description') {
    const options = {
      message_id: callbackQuery.message.message_id,
      chat_id: callbackQuery.message.chat.id,
      disable_web_page_preview: true,
      parse_mode: 'html'
    };
    telegram.editMessageText(<string>updatedMessage, <EditMessageTextOptions>options);
  }
}

export async function inlineSearch(query: any, transports: TranportObjects) {
  if (!checkPermissions(query && query.from && query.from.username || '')) {
    return;
  }
  const { jira, telegram } = transports;
  const { issues } = await jira.getIssuesByName(query.query);
  const suggestions = _.map(issues, (issue: any) => (<InlineQueryResultArticle>{
    id: issue.key,
    type: 'article',
    title: `${issue.key} ${issue.fields.summary}`,
    description: issue.fields.description || '',
    message_text: issue.key,
    url: `${jira.uri}/browse/${issue.key}`,
    thumb_url: issue.fields.assignee && issue.fields.assignee.avatarUrls['48x48'],
    thumb_width: 48,
    thumb_height: 48,
    input_message_content: {
      message_text: issue.key
    }
  }));
  if (issues){
    telegram.answerInlineQuery(query.id, suggestions);
  } else {
    telegram.answerInlineQuery(query.id, []);
  }
}

async function attachFile(issueId: string, fileId: string, transports: TranportObjects) {
  const { jira, telegram } = transports;
  
  if (!fileId) {
    return [];
  }
  
  const fileStream = telegram.getFile(fileId);
  const attach = await jira.addAttachmentOnIssue(issueId, fileStream);

  return attach;
}

