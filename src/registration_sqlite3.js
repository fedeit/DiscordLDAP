var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS users(uid text, discordId text);", () => {
		console.log("Database initialized")
	});
});


exports.getDiscordUserFor = (uid) => {
	db.all("SELECT discordId FROM users WHERE uid = " + uid + ";", function(err, rows) {
		console.log(rows)
	});
}

exports.getLDAPUidFor = (discordId) => {
	db.all("SELECT uid FROM users WHERE discordId = " + discordId + ";", function(err, rows) {
		console.log(rows)
	});
}

exports.registerUser = (uid, discordId) => {
	db.run(`INSERT INTO users(uid, discordId) VALUES(?, ?)`, [uid, discordId], function(err) {
		if (err) {
		  return console.log(err.message);
		}
		console.log(`User ${uid} added to database for discord id ${discordId} at row ${this.lastID}`);
	});
}