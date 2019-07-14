import JiraApi from 'jira-client';

interface ConfigInterface {
  host: string,
  protocol: string,
  username: string,
  password: string,
  port?: string,
  apiVersion?: string,
  strictSSL?: boolean
}

class JiraTransport {
  private config: ConfigInterface
  public uri: string
  public jira: any
  constructor(config: ConfigInterface){
    this.config = {
      apiVersion: '2',
      strictSSL: true,
      ...config,
    };
    this.uri = `${config.protocol}://${config.host}${config.port ? `:${config.port}` : ''}`;
    this.connect();
  }

  private connect() {
    this.jira = new JiraApi(this.config);
  }

  public async getIssues(ids: string[]) {
    try {
      const issues = await this.jira.searchJira(`issueKey IN (${ids.join(',')}) ORDER BY priority DESC`, {
        // fields: ['summary', 'issuetype', 'priority', 'issueKey']
      });
      return issues;
    } catch(e) {
      console.log(e.message);
      return false;
    }
  }

  public async getIssuesByName(str: string) {
    try {
      const issues = await this.jira.searchJira(`summary ~ '${str}' ORDER BY priority DESC`, {
        // fields: ['summary', 'issuetype', 'priority', 'issueKey']
      });
      return issues;
    } catch(e) {
      console.log(e.message);
      return false;
    }
  }

  public async createIssue(issue: object) {
    try {
      const issues = await this.jira.addNewIssue(issue);
      return issues;
    } catch(e) {
      console.log(e.message);
      return false;
    }
  }
}

export default JiraTransport;
