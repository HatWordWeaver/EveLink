'use strict';

const db = require('../db.js');
const monthNames = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const monthAbbreviations = [
  'gen', 'feb', 'mar', 'apr', 'mag', 'giu',
  'lug', 'ago', 'set', 'ott', 'nov', 'dic'
];

function extractFromDate(data) {
  const formattedDate = new Date(data);

  const day = formattedDate.getDate();
  let month = formattedDate.getMonth() + 1;
  if (month < 10) {
    month = `0${month}`;
  }
  const year = formattedDate.getFullYear();

  const hours = formattedDate.getHours();
  const minutes = formattedDate.getMinutes();

  const monthName = monthNames[formattedDate.getMonth()];
  const monthAbbreviation = monthAbbreviations[formattedDate.getMonth()];

  const formattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;

  return {
    giorno: day,
    mese: monthName,
    meseAbbreviato: monthAbbreviation,
    anno: year,
    orario: formattedTime
  };
}

function convertToSQLiteDateTime(inputDate) {
  // Crea un oggetto Data da una stringa nel formato "YYYY-MM-DDTHH:MM"
  const date = new Date(inputDate);

  // Estrai i componenti della data
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Mese (da 0 a 11)
  const day = String(date.getDate()).padStart(2, '0'); // Giorno
  const hours = String(date.getHours()).padStart(2, '0'); // Ore
  const minutes = String(date.getMinutes()).padStart(2, '0'); // Minuti

  // Costruisci la data nel formato DATETIME di SQLite
  const sqliteDateTime = `${year}-${month}-${day} ${hours}:${minutes}:00`;

  return sqliteDateTime;
}

// funzione per estrarre i dati da tutte le righe
function mapEventObject(e) {
  // ottengo la data
  const dateStr = e.data;
  // richiamo la funzione che si occupa di estrarre tutti i dati utili
  const extracted = extractFromDate(dateStr);
  // per ogni riga estraggo queste cose
  return {
    IDevento: e.codice_evento,
    luogo: e.nome_locale,
    indirizzo: e.indirizzo_locale,
    CAP: e.CAP,
    citta: e.citta,
    provincia: e.provincia,
    fondatore: e.fondatore,
    giorno: extracted.giorno,
    mese: extracted.mese, // Assegna il nome del mese
    meseAbbreviato: extracted.meseAbbreviato,
    anno: extracted.anno, // Estrai l'anno
    orario: extracted.orario,
    nome: e.nome,
    descrizione: e.descrizione,
    genere: e.genere_evento,
  };
}

exports.getFounder = function(eventId){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT fondatore
    FROM evento
    WHERE codice_evento = ?
    `;
    db.get(sql, eventId, (err, row) => {
      if(err)
      reject(err);
      else if(row === undefined)
      {
        resolve(null);
      }
      else
      {
        resolve(row.fondatore);
      }
    })
  })
}

// ritorno i prossimi eventi basandomi dalla data attuale di quando faccio la richiesta
exports.ProssimiEventi = function(){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT DISTINCT evento.*, locale.*, strftime('%Y %m %d',evento.data) as "dataEvento",
    strftime('%H %M ',evento.data) as "orario"
    FROM evento JOIN locale ON evento.fondatore = locale.indirizzo_email
    WHERE strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime') <= evento.data AND locale.ban_flag != 1 
    ORDER BY dataEvento, orario
    `;
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else 
      {
        const events = rows.map((mapEventObject));
        resolve(events);
      }
    });
  })
}

// ricerca per nome di un evento
exports.RicercaPerNome = function(stringaRicerca){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT evento.codice_evento, evento.nome, evento.data, evento.descrizione,
         evento.genere_evento, evento.fondatore, locale.CAP, locale.citta,
         locale.indirizzo_locale, locale.nome_locale, locale.provincia,
         strftime('%Y %m %d',evento.data) as "dataEvento",
         strftime('%H %M ',evento.data) as "orario"
    FROM (evento)
    JOIN locale on evento.fondatore = locale.indirizzo_email
    WHERE evento.nome LIKE ? AND evento.fondatore = locale.indirizzo_email
        AND locale.ban_flag != 1
    ORDER BY dataEvento, orario
    `;
    db.all(sql, stringaRicerca, (err, rows) => {
      if (err) reject(err);
      else 
      {
        const events = rows.map((mapEventObject));
        resolve(events);
      }
    });
    })
  };

  exports.RicercaPerDataSpecifica = function(locale, stringaRicerca){
    return new Promise((resolve, reject) => {
      const sql = `
      SELECT evento.codice_evento, evento.nome, evento.data, evento.descrizione,
           evento.genere_evento, evento.fondatore, locale.CAP, locale.citta,
           locale.indirizzo_locale, locale.nome_locale, locale.provincia,
           strftime('%Y %m %d',evento.data) as "dataEvento",
           strftime('%H %M ',evento.data) as "orario"
      FROM (evento)
      JOIN locale on evento.fondatore = locale.indirizzo_email
      WHERE evento.data LIKE ? AND evento.fondatore = locale.indirizzo_email AND locale.ban_flag != 1  AND evento.fondatore = ?
      ORDER BY dataEvento, orario
      `;
      db.all(sql, [stringaRicerca, locale], (err, rows) => {
        if (err) reject(err);
        else 
        {
          const events = rows.map((mapEventObject));
          resolve(events);
        }
      });
      })
    };

    exports.RicercaPerNomeSpecifica = function(locale, stringaRicerca){
      return new Promise((resolve, reject) => {
        const sql = `
        SELECT evento.codice_evento, evento.nome, evento.data, evento.descrizione,
             evento.genere_evento, evento.fondatore, locale.CAP, locale.citta,
             locale.indirizzo_locale, locale.nome_locale, locale.provincia,
             strftime('%Y %m %d',evento.data) as "dataEvento",
             strftime('%H %M ',evento.data) as "orario"
        FROM (evento)
        JOIN locale on evento.fondatore = locale.indirizzo_email
        WHERE evento.nome LIKE ? AND evento.fondatore = locale.indirizzo_email AND locale.ban_flag != 1  AND evento.fondatore = ?
        ORDER BY dataEvento, orario
        `;
        db.all(sql, [stringaRicerca, locale], (err, rows) => {
          if (err) reject(err);
          else 
          {
            const events = rows.map((mapEventObject));
            resolve(events);
          }
        });
        })
      };

// ricerca per data di un evento
exports.RicercaPerData = function(stringaRicerca){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT evento.codice_evento, evento.nome, evento.data, evento.descrizione, 
           evento.genere_evento, evento.fondatore, locale.CAP, locale.citta, 
           locale.indirizzo_locale, locale.nome_locale, locale.provincia,
           strftime('%Y %m %d',evento.data) as "dataEvento",
           strftime('%H %M ',evento.data) as "orario"
    FROM (evento) JOIN locale on evento.fondatore = locale.indirizzo_email
    WHERE evento.data LIKE ? AND evento.fondatore = locale.indirizzo_email AND locale.ban_flag != 1  
    ORDER BY dataEvento, orario
    `;
    db.all(sql, stringaRicerca, (err, rows) => {
      if (err) reject(err);
      else 
      {
        const events = rows.map((mapEventObject));
        resolve(events);
      }
    });
    })
}

// ricerca di un evento per nome del locale
exports.RicercaPerLocale = function(stringaRicerca){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT evento.codice_evento, evento.nome, evento.data, 
           evento.descrizione, evento.genere_evento, evento.fondatore, locale.CAP, 
           locale.citta, locale.indirizzo_locale, locale.nome_locale, locale.provincia,
           strftime('%Y %m %d',evento.data) as "dataEvento",
           strftime('%H %M ',evento.data) as "orario"
    FROM (evento) JOIN locale ON evento.fondatore = locale.indirizzo_email
    WHERE locale.nome_locale LIKE ? AND evento.fondatore = locale.indirizzo_email AND locale.ban_flag != 1  
    ORDER BY dataEvento, orario
    `;
    db.all(sql, stringaRicerca, (err, rows) => {
      if (err) reject(err);
      else 
      {
        const events = rows.map((mapEventObject));
        resolve(events);
      }
    });
    })
}

// questa funzione rimuove un evento indicato con eventId
exports.RimuoviEvento = function(eventId){
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM evento WHERE evento.codice_evento = ? ';
      db.run(sql, eventId, (err) => {
        if (err) {
          reject(err);
        }
        else {
          console.log("Evento rimosso!");
          resolve();
        }
      });
    });
}

// questa funzione ritorna il numero di partecipanti di un evento
exports.getPartecipantiOfEvent = function(eventId) {
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT * 
    FROM partecipa JOIN utente ON utente.indirizzo_email = partecipa.partecipante 
    WHERE partecipa.evento = ? AND ban_flag != 1
    `;
    db.all(sql, eventId, (err, rows) => {
      if (err) reject(err);
      else {
        const users = rows.map((e) => {
          return {
            nome: e.nome,
            cognome: e.cognome,
            indirizzo: e.indirizzo_email,
          };
        });
        resolve(users);
      }
    });
  })
}

// questa funzione ritorna gli eventi per cui un utente
// identificato come "email" partecipa
exports.getEventsOfUser = function (email) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT evento.genere_evento, evento.descrizione, locale.citta, locale.provincia, 
             evento.codice_evento, locale.nome_locale, evento.fondatore, evento.data, 
             evento.nome, locale.indirizzo_locale, locale.CAP 
      FROM (evento, locale)  
      WHERE evento.fondatore = locale.indirizzo_email AND evento.fondatore = ? 
      ORDER BY evento.data
      `;
    db.all(sql, [email], (err, rows) => {
      if (err) reject(err);
      else 
      {
        const events = rows.map((mapEventObject));
        resolve(events);
      }
    });
  });
};

// questa funzione si occupa di direse un utente
// partecipa o meno ad un evento (boolean)
exports.getPartecipazioneOfUser = function(email, eventId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM partecipa 
      WHERE partecipa.partecipante = ? AND partecipa.evento = ?
      `;
    db.get(sql, [email, eventId], (err, row) => {
      if(err)
        reject(err);
      else if(row === undefined)
      {
        resolve(0);
      }
      else
      {
        resolve(1);
      }
    });
  })
};

// questa funzione cerca se un utente partecipa o meno
// ad un evento
exports.getUserFromEvent = function(email, eventId){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT * 
    FROM partecipa JOIN utente on partecipa.partecipante = utente.indirizzo_email 
    WHERE partecipa.evento = ? AND utente.indirizzo_email LIKE ?
    `;
    db.all(sql, [eventId, email], (err, rows) => {
      if(err)
        reject(err);
      else if(rows === undefined)
      {
        resolve(0);
      }
      else
      {
        const user = rows.map((e) => {
        return { 
          indirizzo: e.indirizzo_email, 
          nome: e.nome, 
          cognome: e.cognome, 
          admin: e.admin,
          locale: e.locale,
          nascita: e.data_nascita,
          sesso: e.sesso,
          }
        })
      resolve(user);
      }
    })
  })
}

// questa funzione serve per ricavare tutti gli eventi
// a cui partecipa un utente
exports.getEventsOfUserPart = function (email) {
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT e.genere_evento, e.codice_evento, l.nome_locale, e.fondatore, e.data, e.nome, 
           e.descrizione, l.indirizzo_locale, l.citta, l.CAP, l.provincia 
    FROM evento e JOIN  partecipa p ON e.codice_evento = p.evento 
         JOIN locale l ON e.fondatore = l.indirizzo_email
    WHERE p.partecipante = ? AND l.ban_flag != 1 
    ORDER BY e.data 
    `;
    db.all(sql, email, (err, rows) => {
      if (err) reject(err);
      else 
      {
        const events = rows.map((mapEventObject));
        resolve(events);
      }
    });
  });
};

// ritorna un evento basandosi sul suo eventID
exports.getEventByID = function(eventID){
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * 
      FROM (evento, locale) 
      WHERE evento.fondatore = locale.indirizzo_email AND evento.codice_evento = ?
      `;
    db.get(sql, [eventID], (err, row) => {
      if(err)
        reject(err);
      else if(row === undefined)
        resolve({error: "evento non trovato"});
      else
      {
        const dateStr = row.data;
        const extracted = extractFromDate(dateStr);
        const evento = {
          citta: row.citta, 
          nomeLoc: row.nome_locale,
          nomeEve: row.nome,
          CAP: row.CAP,
          fondatore: row.fondatore,
          provincia: row.provincia,
          indirizzo: row.indirizzo_locale,
          giorno: extracted.giorno,
          mese: extracted.mese, // Assegna il nome del mese
          meseAbbreviato: extracted.meseAbbreviato,
          anno: extracted.anno, // Estrai l'anno
          orario: extracted.orario,
          descrizione: row.descrizione,
          codice_evento: row.codice_evento,
          genere: row.genere_evento,
        };
        resolve(evento);
      }
    });
  });
  };

// questa funzione serve per contare i partecipanti di un evento
exports.getCountPart = function(eventID){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT COUNT(*) AS tot 
    FROM partecipa JOIN utente on partecipa.partecipante = utente.indirizzo_email 
    WHERE evento = ? AND ban_flag != 1
    `;
    db.get(sql, eventID, (err, row) => {
      if(err)
        reject(err);
      else if(row == undefined)
        resolve({error: "evento non trovato"});
      else
        {
          const totale = row.tot;
          resolve(totale);
        }
      })
    })
  }

// questa funzione recupera un evento
// prendendo il suo orario non formattato
exports.getEventRawByID = function(eventID){
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT * 
    FROM (evento, locale) 
    WHERE evento.fondatore = locale.indirizzo_email AND evento.codice_evento = ?
    `;
    db.get(sql, [eventID], (err, row) => {
      if(err)
        reject(err);
      else if(row === undefined)
        resolve({error: "evento non trovato"});
      else
      {
        const evento = 
        {
          citta: row.citta, 
          nomeLoc: row.nome_locale,
          nomeEve: row.nome,
          CAP: row.CAP,
          fondatore: row.fondatore,
          provincia: row.provincia,
          indirizzo: row.indirizzo_locale,
          data: row.data,
          descrizione: row.descrizione,
          codice_evento: row.codice_evento,
          genere: row.genere_evento,
        };
      resolve(evento);
      }
    });
  });
};

// questa funzione inserisce un evento nel database
exports.registerEvent = function(codice_evento, nomeEvento, dataEvento, user, descrizioneEvento, genereEvento) {
    return new Promise((resolve, reject) => {
    const sql = `
    INSERT INTO evento (codice_evento, fondatore, data, nome, descrizione, genere_evento) 
    VALUES (?, ?, ?, ?, ?, ?)
    `;
    const data_corr = convertToSQLiteDateTime(dataEvento);
    const values = [codice_evento, user, data_corr, nomeEvento, descrizioneEvento, genereEvento];
      db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        }
        else {
          console.log("Evento inserito!");
          resolve();
        }
      });
    });
  };

// questa funzione si occupa di aggiornare un evento presente nel database
exports.UpdateEvent = function(nomeEvento, dataEvento, descrizioneEvento, codice_evento, genereEvento) {
  return new Promise((resolve, reject) => {
  const sql = `
  UPDATE evento SET data = ?, nome = ?, descrizione = ?, genere_evento = ? 
  WHERE codice_evento = ?
  `;
  const values = [dataEvento, nomeEvento, descrizioneEvento, genereEvento, codice_evento];
    db.run(sql, values, (err) => {
      if (err) {
        reject(err);
      }
      else 
      {
        console.log("Evento modificato!");
        resolve();
      }
    });
  });
};


// questa funzione serve per inserire un partecipante ad un evento
exports.InsertPartecipante = function(user, eventId) {
  return new Promise((resolve, reject) => {
    const sql = 
    `INSERT INTO partecipa (partecipante, evento) 
     VALUES (?, ?)
     `;
    const values = [user, eventId];
      db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        }
        else {
          console.log("Partecipante aggiunto!");
          resolve();
        }
      });
    });
  };

// questa funzione serve per rimuovere un partecipante da un evento
exports.RimuoviPartecipante = function(user, eventId) {
  return new Promise((resolve, reject) => {
    const sql = `
    DELETE FROM partecipa 
    WHERE partecipa.partecipante = ? AND partecipa.evento =  ?
    `;
    const values = [user, eventId];
      db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        }
        else 
        {
          console.log("Partecipante rimosso!");
          resolve();
        }
      });
    });
  };




  