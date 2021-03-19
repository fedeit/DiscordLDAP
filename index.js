require('dotenv-defaults').config()
const path = require('path')
const jwt = require('jsonwebtoken');
const express = require('express')
const app = express()
const defaultPort = 80
const discordLDAP = require('./src/discord_ldap_sync.js')
const { jwtAuth } = require('./src/middlewares.js')
app.use(express.json())
app.use(express.static(path.join(__dirname, '/web-ui/build')));

app.post('/verify', (req, res) => {
	let { username, password, code } = req.body
	username = username.trim()
	if (!discordLDAP.isSetup()) {
		return res.send({ message: `System down! Please retry in a few minutes or contact a system administrator at ${process.env.SUPPORT_EMAIL}`, verified: false })
	}
	if (code == undefined || username == undefined || password == undefined) {
		return res.send({ message: "Username and password cannot be empty", verified: false })
	}
	console.log("Received verification request from " + username + " with code " + code)
	discordLDAP.verify(code, username, password, (result) => {
		res.send(result)
	});
})

app.get('/api/discordInit', (req, res) => {
	res.redirect('/status')
})

app.get('/api/status', (req, res) => {
	res.send({ systemStatus: discordLDAP.isSetup(), status: discordLDAP.statusFormatted() });
})

app.get('/api/members', jwtAuth, async (req, res) => {
	let users = await discordLDAP.getMembers()
	users = users.filter(member => member.registeredAddress !== undefined)
	res.send(users)
})

app.get('/api/members/toInvite', jwtAuth, async (req, res) => {
	discordLDAP.toInvite((users) => {
		res.send(users)
	})
})

app.get('/api/members/toKick', jwtAuth, async (req, res) => {
	discordLDAP.toKick((users) => {
		res.send(users)
	})
})

app.post('/api/adminLogin', (req, res) => {
    // Read username and password from request body
    const { username, password } = req.body
    if (process.env.ADMIN_USER == username && process.env.ADMIN_PASSWORD == password) {
        // Generate an access token
        const accessToken = jwt.sign({ username: process.env.ADMIN_USER }, process.env.JWT_SECRET)

        res.json({
            accessToken
        })
    } else {
        res.send('Username or password incorrect')
    }
});


app.get('*', function(req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, 'web-ui/build')});
})

let listener = app.listen(process.env.API_PORT || defaultPort, () => {
    console.log('Web App Listening on port ' + listener.address().port);
})