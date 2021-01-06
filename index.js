require('dotenv-defaults').config()
const path = require('path')
const express = require('express')
const app = express()
const defaultPort = 80
const discordLDAP = require('./src/discord_ldap_sync.js')
app.use(express.json())
app.use(express.static(path.join(__dirname, '/web-ui/build')));

app.post('/verify', (req, res) => {
	if (!discordLDAP.isSetup()) {
		return res.send({message: "System down! Please retry in a few minutes or contact a system admin", verified: false})
	}
	if (req.body.code == undefined || req.body.username == undefined || req.body.password == undefined) {
		return res.send({message: "Username and password cannot be empty", verified: false})
	}
	console.log("Received verification request from " + req.body.username + " with code " + req.body.code)
	discordLDAP.verify(req.body.code, req.body.username, req.body.password, (result) => {
		res.send(result);
	});
})

app.get('/api/discordInit', (req, res) => {
	if(!discordLDAP.status.discordUp) {
		discordLDAP.initialize(() => {
			res.redirect('/status');
		})
	} else {
		res.redirect('/status');
	}
})

app.get('/api/status', (req, res) => {
	let propServices = {
		discordUp: "Discord",
		databaseUp: "Database",
		ldapUp: "LDAP",
		whitelistParsed: "Whitelist",
		mailerUp: "Mailer"
	}
	let status = [];
	for (const service in discordLDAP.status) {
		status.push({ name: propServices[service], isUp: discordLDAP.status[service] })
	}
	res.send({systemStatus: discordLDAP.isSetup(), status: status});
})

app.get('*', function(req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, 'web-ui/build')});
});

let listener = app.listen(process.env.port || defaultPort, () => {
    console.log('Web App Listening on port ' + listener.address().port);
})