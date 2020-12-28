const fs = require('fs');
const discord = require('./discord_integration.js')
const ldap = require('./ldap-client.js')
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
//		toInvite = filterSet(toInvite, invited)
		let toRemove = exports.findToRemoveDiscordUsers(discordUsers, ldapResponse);
		toRemove = filterSet(toRemove, whitelistedUsers)
		console.log(toInvite)
		console.log(toRemove)
	});
}

exports.findToAddDiscordUsers = (ldapUsers) => {
	let toAdd = new Set()
	for (const ldapUser of ldapUsers) {
		if (!ldapUser.hasOwnProperty('registeredAddress')) {
			toAdd.add(ldapUser.dn)
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