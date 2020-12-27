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
	// When logged in, retrieve the guild
	client.on('ready', () => {
		console.log(`Logged in as ${client.user.tag}!`);
		// Get the guild
		guild = client.guilds.cache.get(process.env.DISCORD_GUILD);
	});
}

exports.getMembers = (callback) => {
	// Get list of members without caching and forcing not to retrieve from cache
	guild.members.fetch({ cache: false, force: true })
	.then((members) => {
		// Filter out bots and return an array of objects with name only
		let users = members
		.filter( member => !member.user.bot )
		.map( member => member.user );
		// Callback with users
		console.log(users)
		callback(users);
	})
	.catch(console.error);
}

exports.kickMember = (memberId) => {
	// Get the member based on their Id
	let member = guild.members.fetch(memberId)
	.then((member) => {
		// Kick a member from the guild
		member.kick(`You were not found in the ${process.env.ORGANIZATION_NAME} users directory. This is an automatic removal.`);
	})
	.catch(console.error);
}

exports.inviteMember = (email) => {
	// Get the base channel where to add people
	const channel = guild.channels.resolve(process.env.DISCORD_CHANNEL);
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
	  	console.log(`Created an invite with a code of ${invite}`);
	  	mailer.sendInvite(invite, email);
	})
	.catch(console.error);
}