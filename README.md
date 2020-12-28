# DiscordLDAP
<img src="https://img.icons8.com/fluent/48/000000/discord-logo.png"/><img src="https://img.icons8.com/android/40/000000/plus.png"/><img src="https://img.icons8.com/ultraviolet/48/000000/active-directory.png"/>

<b>WARNING: THIS IS AN ALPHA!</b><br>
DiscordLDAP is a simple opensource platform that syncronizes a LDAP with a Discord Guild (Server). It is currently in beta and under initial testing, but has had no major issues until now!

## Description
- DiscordLDAP uses the Discord API to interact with a Guild (a Discord Server). The bot must be given permissions to access the members of the Guild, kick people, create invites, and check user data (user IDs).
- DiscordLDAP also connects to one specified LDAP server using standard protocols (tested with OpenLDAP). The LDAP user must have permissions to add read the list of members of a group, and modify them. It will ONLY modify a specified parameter (default: registeredAddress), to keep track of the Discord ID of each LDAP user.
- The platform keeps syncronized the users in the LDAP group, with the users in the Discord Guild.
  - When a new user is added to the LDAP, and email is sent with the specified SMTP server.
  - When a user is in the Discord Guild but not registered with the LDAP group, it is kicked automatically.
    - Users have a grace period (MAX_SIGNUP_TIME) to verify their identity after joining the Guild, after which they are kicked from the server automatically.
- Users in the waitlist will not be removed from the Discord Guild even if they are not in the LDAP.
- The platform will send unique invites with a specified lifetime, directly to the user via email.
- The system uses a sqlite3 database to remember who it already sent invites to.
- Once received the email invite and joined the Guild, users will be able to verify their identity by messaging the bot their LDAP uid.

## Installation
More info coming soon!

## Discord API Login
To connect to the Discord API you will need the following info. This will let the bot know which Guild (server) and channel to add people to (usually *Welcome* or *General*).
It also needs it's own client ID to distinguish messages, and the bot token provided by the Discord API with the correct authorizations. The bot must be given permissions to access the members of the Guild, kick people, create invites, and check user data (user IDs).
```
DISCORD_BOT_TOKEN=bot token by Discord API
DISCORD_GUILD=Guild (server) id
DISCORD_CHANNEL=General or welcome channel where to invite people
DISCORD_CLIENT_ID=bot user id (client id)
```


## LDAP Login
To connect to a LDAP server you need a user with read/write permissions. Set the following environment variables to connect to the server. Example:
```
LDAP_GROUP=ou=users,dc=example,dc=com
LDAP_URL=ldap://example.com:389
LDAP_BASE_DN=dc=example,dc=com
LDAP_USERNAME=cn=admin,dc=example,dc=com
LDAP_PASSWORD=password
```

## Whitelist
The whitelist.csv file is a simple csv containing the Discord IDs of people who shall not be removed, even if missing in the LDAP group.
To add people, simply modify the file by separating each Discord ID with a comma and without any spaces.

## Email / SMTP
The platform supports SMTP and uses the nodemailer library to send emails. Set the follwing environment variables using a .env file, to allow the system to send emails. Example:
```
SMTP_USERNAME=email@gmail.com
SMTP_PASSWORD=password
SMTP_PORT=465
SMTP_SECURE=true
SMTP_HOST=smtp.google.com
ORGANIZATION_NAME=DiscordLDAP
```

## Autorun
The platform runs on a cron task every a certain amount of time defined by the EXEC_TIME_INTERVAL environment variable. This is expressed in minutes.

## Other
The organization name is used in the email invite and bot messages sent to the user. 
ORGANIZATION_NAME=DiscordLDAP
