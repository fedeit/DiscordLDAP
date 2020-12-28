const mailer = require('./mailer.js')
const Discord = require('discord.js');
const ldap = require('./ldap-client.js')

// Vars to be defined later
var guild;
var client;

exports.initialize = (callback) => {
	console.log("Connecting to Discord API")
	// Add intent for retrieving discord guild
	let intents = new Discord.Intents(Discord.Intents.NON_PRIVILEGED);
	intents.add('GUILD_MEMBERS');
	// Add intent to client
	client = new Discord.Client({ ws: {intents: intents}});
	// Login using token
	client.login(process.env.DISCORD_BOT_TOKEN);
	// When logged in, retrieve the guild
	client.on('ready', () => {
		console.info(`Connected to Discord! Logged in as ${client.user.tag}!`);
		// Get the guild
		guild = client.guilds.cache.get(process.env.DISCORD_GUILD);
		// Listen for registration messages
		listenUIDRegistration();
		callback(true)
	}).on('error', (error) => {
		console.error(error)
		callback(false)
	});
}

exports.getMembers = (callback) => {
	// Get list of members without caching and forcing not to retrieve from cache
	guild.members.fetch({ cache: false, force: true })
	.then((members) => {
		// Filter out bots and return an array of objects with name only
		let users = members
		.filter( member => !member.user.bot )
		.map( (member) => {
			let usr = member.user
			usr.joinedTimestamp = member.joinedTimestamp
			return usr
		});
		// Callback with users
		if (process.env.FULL_LOGGING == 'true') { console.info(users) }
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

let listenUIDRegistration = () => {
	client.on("message", async (message) => {
		if (message.content != "" && message.author.id != process.env.DISCORD_CLIENT_ID) {
			console.log("Registering " + message.author.id + " with uid " + message.content)
			let error = await ldap.setDiscordIdFor(message.content, message.author.id)
			if (error === undefined) {
				message.author.send("Thank you! You are now registered with your organization!");
			} else {
				message.author.send("Oops! We couldn't verify your identity! Error: " + error)
			}
		}
	});
}

exports.inviteMember = (email) => {
	console.info(`Inviting member ${email} to Discord`)
	// Get the base channel where to add people
	const channel = guild.channels.resolve(process.env.DISCORD_CHANNEL);
	console.info(`Found channel ${process.env.DISCORD_CHANNEL} to add user`)
	// Define options
	let options = {
		maxAge: process.env.MAX_INVITE_AGE,
		maxUses: 1,
		unique: true,
		reason: `You were added to the ${process.env.ORGANIZATION_NAME} Discord from the users directory.`
	}
	console.info("Creating Discord invite")
	// Create a discord invite with specified options
	channel.createInvite(options)
	.then(invite => {
		// Send the invite to the user via email
	  	console.info(`Created an invite with a code of ${invite}`);
	  	mailer.sendInvite(invite, email);
	})
	.catch(console.error);
}