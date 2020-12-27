const mailer = require('./mailer.js')
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
	.then((members) => {
		// Filter out bots and return an array of objects with name only

	})
	.catch(console.error);
}

exports.kickMember = (member) => {
	// Kick a member
	member.kick(`You were not found in the ${process.env.ORGANIZATION_NAME} users directory`);
}

exports.inviteMember = (channel, email) => {
	// Define options
	let options = {
		maxAge: process.env.MAX_INVITE_AGE,
		maxUses: 1,
		unique: true,
		reason: `You were added to the ${process.env.ORGANIZATION_NAME} Discord from the users directory.`
	}
	// Create a discord invite with specified options
	channel.createInvite(options)
	.then(invite => {
		// Send the invite to the user via email
	  	console.log(`Created an invite with a code of ${invite.code}`);
	  	mailer.sendInvite(email);
	})
	.catch(console.error);
}