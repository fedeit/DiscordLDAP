const Discord = require('discord.js');
// Vars to be defined later
var guild;
var client;

exports.initialize = () => {
	// Add intent for retrieving discord guild
	let intents = new Discord.Intents(Discord.Intents.NON_PRIVILEGED);
	intents.add('GUILD_MEMBERS');
	// Add intent to client
	client = new Discord.Client({ ws: {intents: intents}});
	// Login using token
	client.login(process.env.DISCORD_BOT_TOKEN);

	client.on('ready', () => {
	  console.log(`Logged in as ${client.user.tag}!`);
	  // Get the guild
	  guild = client.guilds.cache.get(process.env.GUILD);
	});
}

exports.getMembers = (callback) => {
	// Get list of members
	guild.members.fetch({ cache: false })
	.then(callback)
	.catch(console.error);
}
