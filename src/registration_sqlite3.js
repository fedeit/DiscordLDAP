const md5 = require('md5');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/sqldb.db');


exports.setup = (callback) => {
	db.serialize(() => {
		db.run("CREATE TABLE IF NOT EXISTS invites(uid text, invite text);", (err) => {
			if (err) {
				callback(false);
			}
			console.log("invites database initialized")
			db.run("CREATE TABLE IF NOT EXISTS verificationCodes(discordID text, verificationCode text);", (err2) => {
				if (err2) {
					callback(false);
				}
				console.log("verificationCodes database initialized")
				callback(true)
			});

		});
	});

}

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
		if (rows.length == 0) {
			callback(false)
		} else {
			callback(true)
		}
	});
}

exports.generateVerificationCode = (discordID, callback) => {
	let verificationCode = md5(discordID);
	db.run(`INSERT INTO verificationCodes(discordID, verificationCode) VALUES(?, ?)`, [discordID, verificationCode], function(err) {
		if (err) {
			console.error(err)
			callback(undefined, err)
		} else {
			console.log(`Verirication code ${verificationCode} added to database for user ${discordID} at row ${this.lastID}`);
			callback(verificationCode, undefined);
		}
	});
}

exports.getDiscordID = (verificationCode, callback) => {
	db.all('SELECT discordID FROM verificationCodes WHERE verificationCode=?', [verificationCode], function(err,rows) {
		if (err) {
			callback(undefined, err)
		}
		if (rows.length == 0) {
			callback(undefined, "Verification code does not exist")
		} else {
			callback(rows[0].discordID, undefined);
		}
	});
}