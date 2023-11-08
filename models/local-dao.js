'use strict';
const db = require('../db.js');
const bcrypt = require('bcrypt');

// questa funzione controlla che il locale dell'evento non sia bannato
exports.CheckBanLocalEvent = function(eventId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ban_flag 
      FROM locale JOIN evento on locale.indirizzo_email = evento.fondatore AND evento.codice_evento = ?
      `;
    db.get(sql, eventId, (err, row) => {
      if(err){
        reject(err);
      }else if(row === undefined)
      {
        reject({error: "Impossibile trovare l'evento"});
      }
      else
      {
        if(row.ban_flag === 1)
          resolve(true);
        else
          resolve(false);
      }
    })
  })
}

// questa funzione rimuove il ban di un utente locale
exports.RemoveBan = function(localId) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE locale SET ban_flag = 0
      WHERE indirizzo_email = ?
    `;
    db.run(sql, localId, (err) => {
      if(err)
        reject(err);
      else
        resolve();
    })
  })
}

// questa funzione aggiunge il ban di un utente locale
exports.AddBan = function(localId){
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE locale SET ban_flag = 1
      WHERE indirizzo_email = ?
    `;
    db.run(sql, localId, (err) => {
      if(err)
        reject(err);
      else
        resolve();
    })
  })
}

// questa funzione recupera un locale basandosi 
// sulla mail
exports.getLocalWithEmail = function(email){
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM locale
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
          nome: row.nome_locale, 
          indirizzo: row.indirizzo_locale,
          citta: row.citta,
          CAP: row.CAP,
          provincia: row.provincia,
          password: row.password,
          ban_flag: row.ban_flag,
          type: "local",
        };
        resolve({user});
      }
    });
  });
};

// questa funzione recupera tutti i dati di un locale
// basandosi sulla mail, oltre a controllare che la password
// che viene passata sia corretta
// serve per passport
exports.getLocalTotally = function(email, password){
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM locale
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
            resolve({ locale: true, check: false});
          } else {
            const locale = { 
              email: row.indirizzo_email, 
              nome: row.nome_locale, 
              indirizzo: row.indirizzo_locale,
              citta: row.citta,
              CAP: row.CAP,
              provincia: row.provincia,
              password: row.password,
              ban_flag: row.ban_flag,
              type: "local",
              };
            const check = true; // Password verificata con successo
            console.log("Utente trovato:", row);
            console.log("Mando: ", locale);
            resolve({ locale, check });
          }
        });
      }
    });
  });
};

// questa funzione serve per cercare un locale
// all'interno del database utilizzato
exports.searchLocal = function(search) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM locale 
      WHERE indirizzo_email LIKE ?
      `;
    db.all(sql, search, (err, rows) => {
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

// questa funzione va a modificare i dati presenti all'interno del databse
// di un determinato locale
exports.ModifyLocal = function(user, nome, indirizzo, citta, CAP, provincia) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE locale SET nome_locale = ?, indirizzo_locale = ?, citta = ?, CAP = ?, provincia = ? 
        WHERE indirizzo_email = ?
        `;
      const values = [nome, indirizzo, citta, CAP, provincia, user];
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

// questa funzione serve per ottenere un locale basandosi
// sull'ID che viene passato
exports.getLocalById = function(localID) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * 
        FROM locale 
        WHERE locale.indirizzo_email = ?
        `;
      db.get(sql, localID, (err, row) => {
        if(err)
          reject(err);
        else if(row === undefined)
          resolve(null);
        else
        {
          const locale = { 
            nome: row.nome_locale,
            proprietario: row.indirizzo_email,
            indirizzo: row.indirizzo_locale,
            citta: row.citta,
            CAP: row.CAP,
            provincia: row.provincia,
          };
          resolve(locale);
        }
      });
    });
  }

// questa funzione serve per registra un utente locale
// all'interno del database
exports.registerLocal = function (email_locale, password_locale, nome_locale, indirizzo_locale, citta, CAP, provincia) {
    return new Promise((resolve, reject) => {
    const sql = `
    INSERT INTO locale (indirizzo_email, password, nome_locale, indirizzo_locale, citta, CAP, provincia, ban_flag) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const hashedPassword = bcrypt.hashSync(password_locale, 10);
    const values = [email_locale, hashedPassword, nome_locale, indirizzo_locale, citta, CAP, provincia, 0];
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