let discordUp = false, ldapUp = false;
let setLDAP = (s) => {
	ldapUp = s
	if (ldapUp && discordUp) { startSync() }
}
let setDiscord = (s) => {
	discordUp = s
	if (ldapUp && discordUp) { startSync() }
}

// Regex to get email from Discord username
let discordEmailRegExp = process.env.DISCORD_EMAIL_REGEX || /\(([^)]+)\)/

const discord = require('./discord_integration.js')
discord.initialize((connected) => setDiscord(connected))

const ldap = require('./ldap-client.js')
ldap.connect((connected) => setLDAP(connected))


let startSync = () => {
	if (!ldapUp || !discordUp) { return; }
	discord.getMembers(async (discordUsers) => {
		let ldapUsers = await ldap.getUsers(true);
		exports.findMissingDiscordUsers(discordUsers, ldapUsers);
	});
}

exports.findMissingDiscordUsers = (discordUsers, ldapUsersSet) => {
	for (let user in discordUsers) {
		let res = discordEmailRegExp.exec(user.username)
		if (res != null && res.length > 1) {
			let email = res[1];
			if (ldapUsersSet.has(email)) {
				ldapUsersSet.delete(email)
			}
		}
	}
	console.log(ldapUsersSet)
	return ldapUsersSet
}