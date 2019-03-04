# Connect Jira Cloud to Telegram for productivity communications with your team.

## Opportunities:

+ Telegram Bot reads all messages, extracts task numbers from them and sends a summary in reply.
+ Interactions with the task: at the moment only getting the description of the task
+ Inline search by titles and descriptions of tasks

## Installation:

You need to do 3 steps to start the application:

1. Create a bot using [@botfather](https://t.me/botfather), add it to your telegram channel and make it an administrator (so that it can read all messages and look for references to tasks)
2. Create a user in the Jira Cloud. You should receive his email and password.
3. Run the application with the specified environment variables
> We recommend using a [docker image](https://hub.docker.com/r/abdusalamov/telegram-jira-bot) for quick and comfortable application launch.

    docker run -d --env JIRA_HOSTNAME=yourteam.atlassian.net --env JIRA_USER=user@example.com --env JIRA_PASSWORD=security --env TELEGRAM_TOKEN=... --name telegram-jira-bot abdusalamov/telegram-jira-bot:latest

You must specify the following environment variables:

| Variable | Description |
| -------- | ----------- |
| JIRA_HOSTNAME |	The hostname of your Jira instance, for example, yourteam.atlassian.net |
| JIRA_USER |	The user from under whom interaction with Jira will be made| 
| JIRA_PASSWORD |	password| 
| TELEGRAM_TOKEN |	telegram bot token that you received when creating it|

## You have the opportunity to specify a proxy for Telegram

```
TELEGRAM_PROXY_SOCKS5_HOST
TELEGRAM_PROXY_SOCKS5_PORT
TELEGRAM_PROXY_SOCKS5_USERNAME
TELEGRAM_PROXY_SOCKS5_PASSWORD
```

## TODO
+ Matching the Telegram and Jira list of users
+ Creating tasks in one line
