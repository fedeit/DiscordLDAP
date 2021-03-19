const md5 = require('md5');
const path = require('path')
var sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../db/sqldb.db')
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Connected to the database at ', dbPath);
});

exports.setup = (callback1, callback2, callback3) => {
	db.serialize(() => {
		db.run("CREATE TABLE IF NOT EXISTS invites(uid text, invite text);", (err) => {
			if (err) {
				callback1(false)
			}
			callback1(true)
			console.log("invites database initialized")
		});
		db.run("CREATE TABLE IF NOT EXISTS verificationCodes(discordID text, verificationCode text);", (err2) => {
			if (err2) {
				callback2(false)
			}
			callback2(true)
			console.log("verificationCodes database initialized")
		});
		db.run("CREATE TABLE IF NOT EXISTS whitelist(discordID text);", (err2) => {
			if (err2) {
				callback3(false)
			}
			callback3(true)
			console.log("verificationCodes database initialized")
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
			return;
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
			return;
		}
		if (rows.length == 0) {
			callback(undefined, "Verification code does not exist")
		} else {
			callback(rows[0].discordID, undefined);
		}
	});
}

exports.deleteVerificationLink = (code) => {
	db.run(`DELETE FROM verificationCodes WHERE verificationCode=?`, code, function(err) {
		if (err) {
			console.error(err)
		} else {
			console.log(`verificationCode ${code} deleted`);
		}
	});
}

exports.addToWhitelist = (w) => {
	w.forEach(id => {
		db.run(`INSERT INTO whitelist(discordID) VALUES(?)`, [id], function(err) {
			if (err) {
				console.error(err)
			} else {
				console.log(`Whitelist for user ${id} added at row ${this.lastID}`);
			}
		});
	})
}

exports.removeFromWhitelist = () => {
	
}

exports.getWhitelist = (callback) => {
	db.all('SELECT * FROM whitelist', function(err, rows) {
		if (err) {
			callback(undefined, err)
			return;
		}
		let whitelist = rows.map(entry => entry.discordID)
		let set = new Set(whitelist)
		callback(set, undefined);
	});
}