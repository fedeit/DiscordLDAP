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

exports.getUsers = async (asSet = false) => {
	// Get users based on specified filter
	const options = {
		filter: '(objectClass=*)',
		scope: 'sub',
		attributes: ['member', 'mail']
	};
	// Get users from LDAP
	let users = await searchLDAP(process.env.LDAP_GROUP, options)
	if (asSet) {
		let emails = new Set(users.map( usr => usr.mail ))
		return emails
	}
	return users
}

exports.getUserInfo = async (user_dn) => {
	if (!user_dn) { console.error('LDAP ERROR: Couldn not parse user dn: ' + user_dn); return; }
	// Get user - only email and dn
	const options = {
		filter: '(objectClass=*)',
		scope: 'sub',
		attributes: ['mail', 'dn']
	};
	return await searchLDAP(user_dn, options);
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