const TelegramBot = require('node-telegram-bot-api');
const JiraApi = require('jira').JiraApi;
const util = require('util');
const _ = require('lodash');

var jira = new JiraApi('https', 'dveriru.atlassian.net', null, 'r.abdusalamov@dveri.ru', '0xuOFM13zm', '2');
const searchJira = util.promisify(jira.searchJira).bind(jira);

// replace the value below with the Telegram token you receive from @BotFather
const token = '618424404:AAHM-jM1F7uhnXtEhvcvVF3lMNFWZQn5OQ0';

const words = [
  'Кстати,',
  'Если кто не понял,',
  'Если что,',
  'Так, на всякий случай,',
  'Между делом,',
  'Между прочим,',
  'Для склерозников,',
  'Если кто забыл,',
  'Вангую, что',
  'Звезды говорят, что',
  'Подсказка от Jira:'
];

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// bot.onText(/.*/, async (msg, match) => {

// });

// Matches "/echo [whatever]"
bot.onText(/[A-Z]{2,4}-[0-9]{1,}/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  console.log(msg);
  
  const issue = await getIssues(match);

  console.log(issue);

  if (!issue) {
    return;
  }

  const chatId = msg.chat.id;
  const resp = `${words[_.random(0, words.length)]} ${match} — ${issue.issues[0].fields.summary}`; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

const getIssues = async (id) => {
  try {
    const issue = await searchJira(`id = ${id}`, {
      fields: ['summary', 'issuetype', 'priority']
    });
    return issue;
  } catch(e) {
    return false;
  }
};

// Listen for any kind of message. There are different kinds of
// messages.
/* bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
}); */