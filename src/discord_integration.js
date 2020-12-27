const Discord = require('discord.js');
// Vars to be defined later
var guild;
// Add intent for retrieving discord guild
let intents = new Discord.Intents(Discord.Intents.NON_PRIVILEGED);
intents.add('GUILD_MEMBERS');
// Add intent to client
const client = new Discord.Client({ ws: {intents: intents}});
// Login using token
client.login(process.env.DISCORD_BOT_TOKEN);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Connect to the Guild
  guild = client.guilds.cache.get(process.env.GUILD)
  // Get list of members
  guild.members.fetch({ cache: false })
  .then(console.log)
  .catch(console.error);
});

