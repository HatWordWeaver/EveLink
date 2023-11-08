'use strict';
const db = require('../db.js');
const bcrypt = require('bcrypt');

exports.aggiungiAdminUtente = function (userId) {
  return new Promise((resolve, reject) => {
    const sql =`
    UPDATE utente SET admin = ? 
    WHERE indirizzo_email = ?
    `;
    db.run(sql, [1, userId], (err) => {
      if(err)
      {
        reject(err);
      }
      else
      {
        resolve();
      }
    })
  })
}

exports.rimuoviAdminUtente = function (userId) {
  return new Promise((resolve, reject) => {
    const sql =`
    UPDATE utente SET admin = ? 
    WHERE indirizzo_email = ?
    `;
    db.run(sql, [0, userId], (err) => {
      if(err)
      {
        reject(err);
      }
      else
      {
        resolve();
      }
    })
  })
}

exports.UserLocals = function() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM locale
      `;
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else {
        const locali = rows.map((e) => {
          return {
            proprietario: e.indirizzo_email,
            nome: e.nome_locale,
            indirizzo: e.indirizzo_locale,
            citta: e.citta,
            CAP: e.CAP,
            provincia: e.provincia,
            genere_locale: e.genere_locale,
            ban: e.ban_flag,
          };
        });
        resolve(locali);
      }
    });
  })
}

exports.registerUser = function (nome, cognome, email, password, admin,data_nascita, sesso) {
    return new Promise((resolve, reject) => {
    const sql = `
    INSERT INTO utente (nome, cognome, indirizzo_email, password, admin, data_nascita, sesso, ban_flag) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const values = [nome, cognome, email, hashedPassword, admin, data_nascita, sesso, 0];
      db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  };

exports.getUserWithEmail = function(email){
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM utente 
      WHERE indirizzo_email = ?
      `;
    db.get(sql, [email], (err, row) => {
      if(err)
        reject(err);
      else if(row === undefined)
        resolve({error: "utente non trovato"});
      else
      {
        const user = { 
          email: row.indirizzo_email, 
          nome: row.nome, 
          cognome: row.cognome, 
          admin: row.admin,
          nascita: row.data_nascita,
          sesso: row.sesso,
          type: "user",
        };
        resolve({user});
      }
    });
  });
};

// controlla se l'utente è bannato sfruttando il flag "ban_flag"
exports.CheckNotBanned = function(userId){
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ban_flag 
      FROM utente 
      WHERE indirizzo_email = ?
      `;
    db.get(sql, userId, (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(false);
      } else {
        if(row.ban_flag)
        {
          resolve(true);
        }
        else
          resolve(false);
      }
    })
  })
};

exports.getUsersRicerca = function(email) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM utente 
      WHERE indirizzo_email LIKE ?
      `;
    db.all(sql, email, (err, rows) => {
      if (err) reject(err);
      else {
        const utenti = rows.map((e) => {
          return {
            indirizzo: e.indirizzo_email,
            nome: e.nome,
            cognome: e.cognome,
            locale: e.locale,
            admin: e.admin,
            nascita: e.data_nascita,
            sesso: e.sesso,
            ban: e.ban_flag,
          };
        });
        resolve(utenti);
      }
    });
  })
}

exports.getUserTotally = function(email, password) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM utente 
      WHERE indirizzo_email = ?
      `;
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve({ error: "Utente non trovato" });
      } else {
        // Verifica la password
        bcrypt.compare(password, row.password, (err, isMatch) => {
          if (err) {
            reject(err);
          } else if (!isMatch) {
            resolve({ user: true, check: false});
          } else {
            const user = { 
              email: row.indirizzo_email, 
              nome: row.nome, 
              cognome: row.cognome,
              admin: row.admin,
              nascita: row.data_nascita,
              sesso: row.sesso,
              flag_ban: row.ban_flag,
              type: "user",
              };
            const check = true; // Password verificata con successo
            console.log("Mando: ", user);
            resolve({ user, check});
          }
        });
      }
    });
  });
};

exports.getLocalByUser = function(email){
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM locale 
      WHERE proprietario = ?
      `;
    db.get(sql, email, (err, row) => {
        if(err)
          reject(err);
        else if(row === undefined)
          resolve(false);
        else
          resolve(true);
      });
  });
};

exports.getUsersRegistered = function(){
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM utente
      `;
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else {
        const utenti = rows.map((e) => {
          return {
            indirizzo: e.indirizzo_email,
            nome: e.nome,
            cognome: e.cognome,
            admin: e.admin,
            nascita: e.data_nascita,
            sesso: e.sesso,
            ban: e.ban_flag,
          };
        });
        resolve(utenti);
      }
    });
  })
}

exports.BannaUtente = function(userId){
  return new Promise((resolve, reject) =>{
    const sql = `
      UPDATE utente SET ban_flag = ? 
      WHERE indirizzo_email = ?
      `;
    db.run(sql, [1, userId], (err) => {
      if(err)
      {
        reject(err);
      }
      else
      {
        resolve();
      }
    })
  })
}

exports.RimuoviBanUtente = function(userId){
  return new Promise((resolve, reject) =>{
    const sql = `
    UPDATE utente SET ban_flag = ? 
    WHERE indirizzo_email = ?
    `;
    db.run(sql, [0, userId], (err) => {
      if(err)
      {
        reject(err);
      }
      else
      {
        resolve();
      }
    })
  })
}



