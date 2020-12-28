var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS invites(dn text, invite text);", () => {
		console.log("Invites database initialized")
		exports.registerInvite("federico.galbiati@icloud.com", "http://google.com/aassa")
	});
});

exports.registerInvite = (dn, invite) => {
	db.run(`INSERT INTO invites(dn, invite) VALUES(?, ?)`, [dn, invite], function(err) {
		if (err) {
		  return console.log(err.message);
		}
		console.log(`Invite ${invite} added to database for invite ${dn} at row ${this.lastID}`);
		exports.deleteInvite(dn, invite)
	});
}

exports.deleteInvite = (dn) => {
	db.run(`DELETE FROM invites WHERE dn=? `, [dn], function(err) {
		if (err) {
		  return console.log(err.message);
		}
		console.log(`Invite for ${dn} removed from database. User signed up!`);
	});
}