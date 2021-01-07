const fs = require('fs');
const discord = require('./discord_integration.js')
const ldap = require('./ldap_client.js')
const db = require('./registration_sqlite3.js')
const SystemStatus = require('./system_status.js')
const mailer = require('./mailer.js')
exports.isSetup = () => { return SystemStatus.isSetup() }
exports.statusFormatted = () => { return SystemStatus.statusFormatted() }

let whitelistedUsers = new Set();

mailer.verify((connected) => {
	SystemStatus.status.mailerUp = connected
})
discord.initialize((connected) => {
	SystemStatus.status.discordUp = connected
	startSync()
})
ldap.connect((connected) => {
	SystemStatus.status.ldapUp = connected
	startSync()
})
db.setup((invitesConnected) => {
	SystemStatus.status.invitesDBUp = invitesConnected
	startSync()	
}, (verificationCodesConnected) => {
	SystemStatus.status.verificationDBUp = verificationCodesConnected
	startSync()	
}, (whitelistConnected) => {
	db.getWhitelist((users, err) => {
		if (err) {
			SystemStatus.status.whitelistDBUp = false
			return;
		} else {
			SystemStatus.status.whitelistDBUp = true
			whitelistedUsers = users
			console.log("Whitelist parsed, found users:", whitelistedUsers.size)
			startSync()	
		}
	})
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
		console.log("Completed sync process")
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
			toAdd.push({ uid: ldapUser.uid, email: ldapUser.mail })
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
	if (process.env.DEVELOPMENT) { return; }
	for (const person of people) {
		if (person.email == undefined || person.uid == undefined) { continue; }
		db.isInviteSent(person.uid, (isSent) => {
			if (!isSent) {
				console.log("Sending info to ", person.email)
				// Email the person's email
				discord.inviteMember(person.email, (token) => {
					// Add to db
					db.registerInvite(person.uid, token)
				  	mailer.sendInvite(token, person.email);
				})
			} else {
				console.log("Invite already sent to", person.email)
			}
		})
	}
}

let kickUsers = (people) => {
	if (process.env.DEVELOPMENT) { return; }
	people.forEach((person) => {
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
		console.log("Registering " + discordID + " with uid " + username + " using verification code " + code)
		let discordError = await ldap.setDiscordIdFor(username, password, discordID)
		if (discordError === undefined) {
			let message = "Thank you! You are now registered with your organization!" || process.env.CONFIRMATION_MESSAGE
			discord.sendMessage(discordID, message)
			db.deleteVerificationLink(code)
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