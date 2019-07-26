import Telegram from './transports/telegram';
import Jira from './transports/jira';
import * as commands from './commands';

export interface TranportObjects {
  telegram: Telegram,
  jira: Jira
}

class App {
  public transports: TranportObjects
  constructor() {
    this.transports = {
      telegram: new Telegram(<string> process.env.TELEGRAM_TOKEN, {
        proxy: {
          host: process.env.TELEGRAM_PROXY_SOCKS5_HOST,
          port: process.env.TELEGRAM_PROXY_SOCKS5_PORT,
          username: process.env.TELEGRAM_PROXY_SOCKS5_USERNAME,
          password: process.env.TELEGRAM_PROXY_SOCKS5_PASSWORD,
        }
      }),
      jira: new Jira({
        protocol: 'https',
        host: <string> process.env.JIRA_HOSTNAME,
        port: <string> process.env.JIRA_PORT,
        username: <string> process.env.JIRA_USER,
        password: <string> process.env.JIRA_PASSWORD
      })
    };
    this.run();
  }

  run() {
    this.transports.telegram.on('enrich', (msg, match) => {
      commands.enrichIssues(msg, match, this.transports);
    });
    this.transports.telegram.on('createIssue', (msg, project, summary, assigner) => {
      commands.createIssue(msg, project, summary, assigner, this.transports);
    });
    this.transports.telegram.on('createComment', (msg, issueKey, comment) => {
      commands.createComment(msg, issueKey, comment, this.transports);
    });
    this.transports.telegram.on('keyboardRequest', (callbackQuery, match) => {
      commands.onKeyboardRequest(callbackQuery, match, this.transports);
    });
    this.transports.telegram.on('inlineSearch', (query) => {
      commands.inlineSearch(query, this.transports);
    });
  }
}

export default new App();
