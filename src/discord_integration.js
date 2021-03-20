const db = require('./registration_sqlite3.js')
const Discord = require('discord.js');
const ldap = require('./ldap_client.js')

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
	// When logged in, retrieve the guild
	client.on('ready', () => {
		console.info(`Connected to Discord! Logged in as ${client.user.tag}!`);
		// Get the guild
		client.guilds.fetch(process.env.DISCORD_GUILD)
		.then(g => {
			guild = g
			if (guild == undefined) {
				console.error("DISCORD ERROR: Cannot get Guild", process.env.DISCORD_GUILD)
				return callback(false)
			}
			// Listen for registration messages
			listenUIDRegistration();
		    client.user.setStatus('available')
			callback(true)
		})
		.catch(e => {
			console.error(e)
			callback(false)
		});
	}).on('error', (error) => {
		console.error(error)
		callback(false)
	});
	// Login using token
	client.login(process.env.DISCORD_BOT_TOKEN);
}

exports.sendMessage = (discordId, message) => {
	guild.members.fetch(discordId).then((user) => {
		user.send(message);
	});
}

exports.getMembers = (callback) => {
	console.log("Getting Discord Members")
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
	if (process.env.DEVELOPMENT == "TRUE") { return; }
	console.log("Kicking member " + memberId)
	// Get the member based on their Id
	let member = guild.members.fetch(memberId)
	.then((member) => {
		// Kick a member from the guild
		member.kick(`You were not found in the ${process.env.ORGANIZATION_NAME} users directory. This is an automatic removal.`);
	})
	.catch(console.error);
}

let listenUIDRegistration = () => {
	if (process.env.MESSAGE_ON_JOIN == "TRUE") {
		client.on('guildMemberAdd', async (member) => {
			await sendVerificationLink(member);
		});
		console.info("Setup for onGuildMemberAdd completed")
	}
	if (true) {
		client.on("message", async (message) => {
			if (message.content.toLowerCase() == "verify" && message.author.id != process.env.DISCORD_CLIENT_ID) {
				await sendVerificationLink(message.author);
			}
		});
		console.info("Setup for onMessage completed")
	}
}

let sendVerificationLink = async (member) => {
	// Check user is already registered
	if (await ldap.isDiscordIdInUse(member)) {
		member.send("Your Discord id is already registered.")
		return
	}
	// Generate verification code
	console.log("Sending verification link to user", member.username)
	db.generateVerificationCode(member.id, (code, error) => {
		if (error) {
			member.send(error)
		} else {
			member.send("Here's a verification link! Make sure you don't share it with others as it is unique and one-time for you: " + process.env.API_HOSTNAME + code)
		}
	})
}

exports.inviteMember = async (email, callback) => {
	console.info(`Inviting member ${email} to Discord`)
	// Get the base channel where to add people
	const channel = guild.channels.resolve(process.env.DISCORD_CHANNEL);
	console.info(`Found channel ${process.env.DISCORD_CHANNEL} to add user`)
	// Define options
	let options = {
		maxAge: parseInt(process.env.MAX_INVITE_AGE),
		maxUses: 1,
		unique: true,
		reason: `You were added to the ${process.env.ORGANIZATION_NAME} Discord from the users directory.`
	}
	console.info("Creating Discord invite")
	try {
		// Create a discord invite with specified options
		let invite = await channel.createInvite(options)
		// Print info and callback
	  	console.info(`Created an invite with a code of ${invite}`);
	  	return invite.toString();
  	} catch(err) {
		console.error(err)
		return undefined;
  	}
}

