interface Issue {
  key: string,
  fields: {
    summary: string,
    description: string,
    assignee: {
      displayName: string
    },
    status: {
      name: string
    }
  }
}

export const formatMessage = (obj: Issue) => {
  const msg = [];
  msg.push(`<a href="https://${process.env.JIRA_HOSTNAME}/browse/${obj.key}">${obj.key} ${obj.fields.summary}</a>`);
  msg.push(`Assignee: <b>${obj.fields.assignee.displayName}</b>`);
  msg.push(`Status: <b>${obj.fields.status.name}</b>`);
  return msg.join('\n');
};

export const addDescription = (text: string, description: string) => {
  return `${text}\nDescription:\n${description}`;
};

interface Result {
  [tguser: string]: string
}

export const getUsers = () => {
  const users = process.env.USERS || '';
  const pairs = users.split(process.env.USERS_DELIMITER || ',');
  const result: Result = {};
  pairs.forEach((str: string) => {
    const [ telegramUser, jiraUser ] = str.split(':');
    result[telegramUser] = <string>jiraUser;
  });
  return result;
};

export const checkPermissions = (username: string) => {
  const users = getUsers();
  return !!users[username];
}
