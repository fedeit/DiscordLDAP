const fs = require('fs');
const discord = require('./discord_integration.js')
const ldap = require('./ldap_client.js')
const db = require('./registration_sqlite3.js')

let loadWhitelistCSV = (callback) => {
	let file = ""
	fs.createReadStream(__dirname + '/../whitelist.csv')
	.on('data', (data) => {
		file += data
	})
	.on('end', () => {
		let whitelist = new Set(file.split(','))
		callback(whitelist)
		setWhitelistParsed(true)
	})
	.on('error', (e) => {
		console.error(e)
		setWhitelistParsed(false)
	})
}

let whitelistedUsers = new Set();
loadWhitelistCSV((users) => {
	whitelistedUsers = users
})

let discordUp = false, ldapUp = false, whitelistParsed = false;
let setWhitelistParsed = (s) => {
	whitelistParsed = s
	startSync()
}
let setLDAP = (s) => {
	ldapUp = s
	startSync()
}
let setDiscord = (s) => {
	discordUp = s
	startSync()
}

discord.initialize((connected) => setDiscord(connected))
ldap.connect((connected) => setLDAP(connected))

let startSync = () => {
	if (!(ldapUp && discordUp && whitelistParsed)) { return }
	discord.getMembers(async (discordUsers) => {
		let ldapResponse = await ldap.getUsers(true);
		let toInvite = exports.findToAddDiscordUsers(ldapResponse);
		//toInvite = removeInvited(toInvite)
		//sendInvites(toInvite)
		let toRemove = exports.findToRemoveDiscordUsers(discordUsers, ldapResponse);
		toRemove = filterSet(toRemove, whitelistedUsers)
		kickUsers(toRemove)
		console.log(toRemove)
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
	for (person in people) {
		// Email the person's email
		discord.inviteMember(people.email, (token) => {
			// Add to db
			db.registerInvite(person.uid, token)
		})
	}
}

let kickUsers = (people) => {
	people.forEach((person) => {
		console.log(typeof person)
		// Email the person's email
		discord.inviteMember(person)
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