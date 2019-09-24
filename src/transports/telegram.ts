import TelegramBot from 'node-telegram-bot-api';
import Agent from 'socks5-https-client/lib/Agent';
import { EventEmitter } from 'events';

export interface Message extends TelegramBot.Message {};
export interface CallbackQuery extends TelegramBot.CallbackQuery {};
export interface SendMessageOptions extends TelegramBot.SendMessageOptions {};
export interface EditMessageTextOptions extends TelegramBot.EditMessageTextOptions {};
export interface InlineQueryResultArticle extends TelegramBot.InlineQueryResultArticle {};

class TelegramTransport extends EventEmitter {
  public bot!: TelegramBot;
  private token: string;
  private options: TelegramBot.ConstructorOptions;
  private regExp: RegExp;
  private createIssueRegExp: RegExp;
  private createCommentRegExp: RegExp;

  constructor(token: string, options: any) {
    super();
    this.token = token;
    this.options = {
      polling: true
    };
    if (options.proxy.host) {
      this.options.request = <any> {
        agentClass: Agent,
        agentOptions: {
          socksHost: options.proxy.host,
          socksPort: options.proxy.port,
          socksUsername: options.proxy.username,
          socksPassword: options.proxy.password,
        }
      };
    }
    this.regExp = /([A-Z]{2,8}-[0-9]{1,5})/g;
    this.createIssueRegExp = /\/(?:create|add)(?:\s+(?:task|issue))?(?:\s+in)?\s+([A-Z]{2,8})\s+([^@]*)\s?(?:@(.+))?/;
    this.createCommentRegExp = /\/(?:comment|addcomment)\s([A-Z]{2,8}-[0-9]{1,5})\s?((?:.|\n)*)/;
    this.connect();
  }

  private connect() {
    this.bot = new TelegramBot(this.token, this.options);
    this.bot.onText(this.regExp, this.onEnrich.bind(this));
    this.bot.onText(this.createIssueRegExp, this.onCreateIssue.bind(this));
    this.bot.onText(this.createCommentRegExp, this.onCreateComment.bind(this));
    this.bot.on('callback_query', this.onCallbackRequest.bind(this));
    this.bot.on('inline_query', this.onInlineSearchRequest.bind(this));
  }

  private async onEnrich(msg: Message) {
    if (!msg.text) {
      return;
    }
    const match = msg.text.match(this.regExp);
    if (!match || !match.length) {
      return;
    }

    if (msg.text.startsWith('/comment')) {
      return;
    }

    this.emit('enrich', msg, match);
  }

  private async onCreateIssue(msg: Message) {  
    if (!msg.text) {
      return;
    }
    const match = msg.text.match(this.createIssueRegExp);
    let [ command, project, summary, assigner ] = match;
    
    this.emit('createIssue', msg, project, summary, assigner);
  }

  private async onCreateComment(msg: Message) {
    if (!msg.text) {
      return;
    }
    const match = msg.text.match(this.createCommentRegExp);
    let [ command, issue, comment ] = match;
    
    this.emit('createComment', msg, issue, comment);
  }

  private async onCallbackRequest(callbackQuery: CallbackQuery) {
    if (!callbackQuery.message || !callbackQuery.message.reply_to_message || !callbackQuery.message.reply_to_message.text) {
      return;
    }
    const match = callbackQuery.message.reply_to_message.text.match(this.regExp);
    if (!match) {
      return;
    }

    this.emit('keyboardRequest', callbackQuery, match, this.editMessageText.bind(this));
  }

  private async onInlineSearchRequest(query: any) {
    if (!query.query.length) {
      return;
    }

    this.emit('inlineSearch', query, this.answerInlineQuery.bind(this));
  }

  public async editMessageText(text: string, options: TelegramBot.EditMessageTextOptions) {
    return this.bot.editMessageText(text, options);
  }

  public async answerInlineQuery(queryId: string, suggestion: Array<TelegramBot.InlineQueryResultArticle>) {
    return this.bot.answerInlineQuery(queryId, suggestion);
  }

  public sendChatAction(chatId: number, action: TelegramBot.ChatAction) {
    return this.bot.sendChatAction(chatId, action);
  }

  public async sendMessage(chatId: number, resp: string, options?: object) {
    return this.bot.sendMessage(<number>chatId, <string>resp, <TelegramBot.SendMessageOptions>options);
  }

  public getFile(fileId: string) {
    return this.bot.getFileStream(fileId);
  }
}

export default TelegramTransport;
