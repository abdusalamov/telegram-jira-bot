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

export const formatMessage = (obj: Issue, withDescription?: boolean) => {
  console.log(obj.fields);
  const msg = [];
  msg.push(`<a href="https://${process.env.JIRA_HOSTNAME}/browse/${obj.key}">${obj.key} ${obj.fields.summary}</a>`);
  msg.push(`Assignee: <b>${obj.fields.assignee.displayName}</b>`);
  msg.push(`Status: <b>${obj.fields.status.name}</b>`);
  if (withDescription) {
    msg.push(`Assigne: <b>${obj.fields.description}</b>`);
  }
  return msg.join('\n');
};

export const addDescription = (text: string, description: string) => {
  return `${text}\nDescription:\n${description}`;
};