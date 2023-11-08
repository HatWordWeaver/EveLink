const sqlite = require('sqlite3');

const db = new sqlite.Database("./database.db", sqlite.OPEN_READWRITE, (err) => {
  if (err) return console.error(err);
  else console.log("connected to db");
});

db.get("PRAGMA foreign_keys = ON");

module.exports = db;