exports.propServices = {
	discordUp: "Discord",
	invitesDBUp: "Invites Service Database",
	ldapUp: "LDAP",
	whitelistDBUp: "Whitelist Database",
	mailerUp: "Mailer",
	verificationDBUp: "Verification Service Database"
}

exports.status = {
	discordUp: false,
	ldapUp: false,
	whitelistDBUp: false,
	verificationDBUp: false,
	invitesDBUp: false,
}

exports.isSetup = () => {
	for (const service in this.status) {
		if (this.status[service] == false) {
			return false;
		}
	}
	return true;
}

exports.statusFormatted = () => {
	let status = [];
	for (const service in status) {
		status.push({ name: propServices[service], isUp: status[service] })
	}
	return status;
}
