let propServices = {
	discordUp: "Discord",
	invitesDBUp: "Invites Service Database",
	ldapUp: "LDAP",
	whitelistDBUp: "Whitelist Database",
	mailerUp: "Mailer",
	verificationDBUp: "Verification Service Database",
}

exports.status = {
	discordUp: false,
	ldapUp: false,
	whitelistDBUp: false,
	verificationDBUp: false,
	invitesDBUp: false,
	mailerUp: false
}

exports.isSetup = () => {
	for (const service in exports.status) {
		if (exports.status[service] == false) {
			return false;
		}
	}
	return true;
}

exports.statusFormatted = () => {
	let status = [];
	for (const service in exports.status) {
		status.push({ name: propServices[service], isUp: exports.status[service] })
	}
	return status;
}
