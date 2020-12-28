var LdapClient = require('ldapjs-client');

// Get config from env variables
var client = new LdapClient({ url: process.env.LDAP_URL });

// Method to connect to the LDAP server
exports.connect = async (callback) => {
	try {
		console.info(`Connecting to LDAP with URL ${process.env.LDAP_URL}`)
		// Connecting to client with username and password
		await client.bind(process.env.LDAP_USERNAME, process.env.LDAP_PASSWORD);
		console.info('Connected to LDAP successfully!')
		// Test retrieving users from LDAP group
		console.info('Test retrieve all users from LDAP')
		await exports.getUsers()
		console.info('Test users received correctly!')
		callback(true)
	} catch (e) {
		console.error('LDAP ERROR: Bind failed' + e)
		callback(false)
	}
}

let isDiscordIdInUse = async (discordId) => {
	const options = {
		filter: '(registeredAddress=' + discordId + ')',
		scope: 'sub',
		attributes: ['dn']
	};

	// Check if discord id is already in use
	let usersWDiscordId = await searchLDAP(process.env.LDAP_GROUP, options)
	return usersWDiscordId.length > 0;
}

exports.setDiscordIdFor = async (uid, discordId) => {
	try {
		// Check if discord id is already used
		if (await isDiscordIdInUse(discordId)) {
			console.warn("User " + discordId + " already registered with another userid! (trying " + uid +")")
			return "You already registered with another userid!"
		}
		// Get user from LDAP 
		let user = await getUserInfo(uid)
		if (user.length > 0) {
			user = user[0]
			console.info("Found user " + uid + " in LDAP")
			var change = {}
			if (user.registeredAddress === undefined) {
				console.info("User not registered yet")
				change = {
					operation: 'add',
					modification: {
					  registeredAddress: discordId
					}
				};
			} else {
				console.info("User " + discordId + " tried to signup with uid already in use " + uid)
				return "User " + uid + " is already registered!"
			}
			console.info("Adding discord id to LDAP user " + uid)
			await client.modify(user.dn, change);
			return undefined;
		}
		console.info("Could not find a user with ID " + uid)
		return "Could not find a user with ID " + uid;
	} catch (e) {
		console.error(e)
		return e.name;
	}		
}

exports.getUsers = async () => {
	// Get users based on specified filter
	const options = {
		filter: '(objectClass=*)',
		scope: 'sub',
		attributes: ['registeredAddress', 'mail', 'uid']
	};
	// Get users from LDAP
	let users = await searchLDAP(process.env.LDAP_GROUP, options)
	return users
}

exports.getUserInfo = async (uid) => {
	// Get user based on their uid
	const options = {
		filter: '(uid=' + uid + ')',
		scope: 'sub',
		attributes: ['dn', 'registeredAddress', 'uid']
	};
	// Get users from LDAP
	let user = await searchLDAP(process.env.LDAP_GROUP, options)
	return user;
}

let searchLDAP = async (dn, options) => {
	try {
		// Fetch content from LDAP
		const entries = await client.search(dn, options)
		if (process.env.FULL_LOGGING == 'true') { console.info(entries) }
		return entries
	} catch (e) {
	  console.error(e);
	}
}