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
		let res = await exports.getUsers()
		if (res) {
			console.info('Test users received correctly!')
			callback(true)
		} else {
			console.error('LDAP ERROR: Test users not received')
			callback(false)
		}
	} catch (e) {
		console.error('LDAP ERROR: Bind failed' + e)
		callback(false)
	}
}

exports.isDiscordIdInUse = async (discordId) => {
	const options = {
		filter: '(registeredAddress=' + discordId + ')',
		scope: 'sub',
		attributes: ['dn']
	};

	// Check if discord id is already in use
	let usersWDiscordId = await searchLDAP(process.env.LDAP_OU, options)
	if (usersWDiscordId == undefined) {
		return true;
	}
	return usersWDiscordId.length > 0;
}

exports.setDiscordIdFor = async (uid, password, discordId) => {
	try {
		// Check if discord id is already used
		if (await exports.isDiscordIdInUse(discordId)) {
			console.warn("User " + discordId + " already registered with another discord user! (trying " + uid +")")
			return "You already registered with another userid!"
		}
		var user = await exports.getUserInfo(uid);
		// Get user from LDAP 
		if (user.length > 0) {
			user = user[0]
			var tempClient = new LdapClient({ url: process.env.LDAP_URL });
			// Test Username and Password
			await tempClient.bind(user.dn, password);
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
				console.info("User " + discordId + " tried to signup with already verified user " + uid)
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
	console.log("Getting users from LDAP")
	// Get users based on specified filter
	const options = {
		filter: process.env.LDAP_GROUP_QUERY,
		scope: 'sub',
		attributes: ['registeredAddress', 'mail', 'uid']
	};
	// Get users from LDAP
	let users = await searchLDAP(process.env.LDAP_OU, options)
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
	let user = await searchLDAP(process.env.LDAP_OU, options)
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
		return undefined
	}
}