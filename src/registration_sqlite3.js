var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/sqldb.db');

db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS invites(uid text, invite text);", () => {
		console.log("Invites database initialized")
	});
});

exports.registerInvite = (uid, invite) => {
	db.run(`INSERT INTO invites(uid, invite) VALUES(?, ?)`, [uid, invite], function(err) {
		if (err) {
		  return console.log(err.message);
		}
		console.log(`Invite ${invite} added to database for invite ${uid} at row ${this.lastID}`);
	});
}

exports.deleteInvite = (uid) => {
	db.run(`DELETE FROM invites WHERE uid=? `, [uid], function(err) {
		if (err) {
		  return console.log(err.message);
		}
		console.log(`Invite for ${uid} removed from database. User signed up!`);
	});
}

exports.isInviteSent = (uid, callback) => {
	db.all('SELECT * FROM invites WHERE uid=?', [uid], function(err, rows) {
		if (err) {
		  return console.log(err.message);
		}
		if (rows == 0) {
			callback(false)
		} else {
			callback(true)
		}
	});
}