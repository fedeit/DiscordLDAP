const fs = require('fs');
const discord = require('./discord_integration.js')
const ldap = require('./ldap_client.js')
const db = require('./registration_sqlite3.js')
const SystemStatus = require('./system_status.js')

let loadWhitelistCSV = () => {
	let file = ""
	fs.createReadStream(__dirname + '/../whitelist.csv')
	.on('data', (data) => {
		file += data
	})
	.on('end', () => {
		let whitelist = new Set(file.split(','))
		SystemStatus.status.whitelistDBUp = true
	})
	.on('error', (e) => {
		SystemStatus.status.whitelistDBUp = false
		console.error(e)
	})
}

let whitelistedUsers = new Set();
loadWhitelistCSV()

discord.initialize((connected) => {
	SystemStatus.status.discordUp = connected
	startSync()
})
ldap.connect((connected) => {
	SystemStatus.status.ldapUp = connected
	startSync()
})
db.setup((connected) => {
	SystemStatus.status.verificationDBUp = connected
	SystemStatus.status.invitesDBUp = connected
	startSync()
})

let startSync = () => {
	if (!(SystemStatus.isSetup())) { return }
	discord.getMembers(async (discordUsers) => {
		let ldapResponse = await ldap.getUsers(true);
		let toInvite = exports.findToAddDiscordUsers(ldapResponse);
		sendInvites(toInvite)
		let toRemove = exports.findToRemoveDiscordUsers(discordUsers, ldapResponse);
		toRemove = filterSet(toRemove, whitelistedUsers)
		kickUsers(toRemove)
	});
}

exports.toInvite = (callback) => {
	discord.getMembers(async (discordUsers) => {
		let ldapResponse = await ldap.getUsers(true);
		let toInvite = exports.findToAddDiscordUsers(ldapResponse);
		callback(toInvite)
	});
}

exports.toKick = (callback) => {
	discord.getMembers(async (discordUsers) => {
		let ldapResponse = await ldap.getUsers(true);
		let toRemove = exports.findToRemoveDiscordUsers(discordUsers, ldapResponse);
		toRemove = filterSet(toRemove, whitelistedUsers)
		callback(toRemove)
	});
}

exports.findToAddDiscordUsers = (ldapUsers) => {
	let toAdd = []
	for (const ldapUser of ldapUsers) {
		if (!ldapUser.hasOwnProperty('registeredAddress')) {
			toAdd.push({ uid: ldapUser.uid, email: ldapUser.email })
		}
	}
	return toAdd
}

exports.findToRemoveDiscordUsers = (discordUsers, ldapUsers) => {
	let ldapDiscordIds = new Set(ldapUsers.map( usr => usr.registeredAddress ))
	let toRemove = new Set()
	discordUsers.forEach( (user) => {
		if (!ldapDiscordIds.has(user.id) && timeDifference(user.joinedTimestamp) > 60) {
			toRemove.add(user.id)
		}
	})
	return toRemove
}

let sendInvites = (people) => {
	for (const person of people) {
		if (person.email === undefined || person.uid === undefined) { continue; }
		db.isInviteSent(person.uid, (isSent) => {
			if (!isSent) {
				// Email the person's email
				discord.inviteMember(person.email, (token) => {
					// Add to db
					db.registerInvite(person.uid, token)
				})
			}
		})
	}
}

let kickUsers = (people) => {
	people.forEach((person) => {
		console.log(typeof person)
		// Email the person's email
		discord.kickMember(person)
	})
}

let timeDifference = (timestamp) => {
	let diffMs = (new Date() - new Date(timestamp)); // milliseconds between now & Christmas
	let minutes = Math.floor((diffMs / 1000) / 60);
	return minutes;
}

let filterSet = (all, subtract) => {
	let filtered = new Set (
    		[...all].filter(x => !subtract.has(x))
	);
	return filtered;
}

exports.verify = (code, username, password, callback) => {
	db.getDiscordID(code, async (discordID, error) => {
		if (error) {
			callback({message: error, verified: false})
		}
		console.log(discordID)
		console.log("Registering " + discordID + " with uid " + username + " using verification code " + code)
		let discordError = await ldap.setDiscordIdFor(username, password, discordID)
		if (discordError === undefined) {
			let message = "Thank you! You are now registered with your organization!" || process.env.CONFIRMATION_MESSAGE
			discord.sendMessage(discordID, message)
			db.deleteInvite(username)
			callback({message: message, verified: true})
		} else {
			let message = "Oops! We couldn't verify your identity! Error: " + discordError
			discord.sendMessage(discordID, message)
			callback({message: message, verified: false})
		}

	});
}

exports.getMembers = async () => {
	let users = await ldap.getUsers()
	return users
}