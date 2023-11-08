'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const EventDao = require('../models/events-dao');
const {check, validationResult} = require('express-validator');

router.use(express.static(path.join(__dirname, '../public')));

/*
  route di tipo GET che serve per reinderizzare alla pagina .ejs per cui ci 
  sono i campi necessari per creare un evento. Può accedere a quella pagina
  solamente un utente che sia un locale
*/
router.get('/', (req, res) => {
    // se l'utente è autenticato
    if(req.isAuthenticated())
    {
      // se l'utente è un locale può essere reinderizzato lì
      if(req.user.type === 'local')
      {
        res.render('insert_event.ejs', {failure: false, insert: true, aut: true, type: 'local', email: req.user.email, admin: false}); 
      }
      // altrimenti torna al menù principale
      else
      {
        res.redirect('/');
      }
    }
    // se non è registrato viene mandato alla finestra di login
    else
    {
      res.redirect('/login');
    }
});
  
/*
  funzione POST per inserire un evento all'interno del database
*/
router.post('/', [
  check('nomeEvento').notEmpty().withMessage('Inserisci un nome!'),
  check('dataEvento').notEmpty().withMessage('Inserisci una data!'),  
  check('descrizioneEvento').notEmpty().withMessage('Inserisci una descrizione al tuo evento!'),
  check('genereEvento').notEmpty().withMessage('Inserisci un genere al tuo evento'),
  ], async (req, res) => {
  // estraggo gli errori che ottengo dai check
  const errors = validationResult(req);
  // controllo che chi richiede sia effettivamente autenticato nel server
  // e inoltre che sia anche un locale

  if(req.isAuthenticated() && req.user.type == 'local')
  {
    // se ci sono errori li mando a schermo nella console e non faccio eseguire nulla
    if (!errors.isEmpty()) {
      console.log('cant execute');
      res.render('insert_event.ejs', {failure: true, error: errors.errors[0].msg, insert: true, aut: true, type: 'local', email: req.user.email, admin: false})
    } 
    else 
    {
      try 
      {
        // estraggo la mail dell'utente
        const user = req.user.email;
        // tolgo gli spazi dal nome dell'evento
        var nomeEvento = req.body.nomeEvento.replace(/\s/g, '')
        .replace(/'/g, '')
        .replace(/</g, '')
        .replace(/>/g, '')
        .replace(/&/g, '')
        .replace(/\"/g, '')
        .replace(/#/g, '')
        .replace(/\//g, '');
        // creo il codice dell'evento
        const codice_evento = nomeEvento + req.body.dataEvento + req.user.email;
        // eseguo la query per registrare con successo l'evento
        await EventDao.registerEvent(codice_evento, req.body.nomeEvento, req.body.dataEvento, user, req.body.descrizioneEvento, req.body.genereEvento);
        res.redirect('/');
      } 
      catch(error) 
      {
        console.log(error);
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nella registrazione dell\'evento.'});
      }
    }
  }
  // se non è autenticato o un locale, reinderizzo alla pagina principale
  // *NOTA* magari inserisci una pagina di errore
  else
  {
    res.redirect('/');
  }
});



module.exports = router;