'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const EventDao = require('../models/events-dao');
const LocalDao = require('../models/local-dao');


router.use(express.static(path.join(__dirname, '../public')));

// funzione che prende gli eventi creati da un locale
router.get('/', async (req, res) => {
  // se chi fa la richiesta è autenticato
  if(req.isAuthenticated()){
    const user = req.user;
    // cerco gli eventi dell'utente
    const eventsPerPage = 12;
    try{
      const events = await EventDao.getEventsOfUser(user.email);
      const page = parseInt(req.query.page) || 1; // Numero di eventi da visualizzare per pagina
      const startIndex = (page - 1) * eventsPerPage; // Calcola l'indice di inizio
      const endIndex = startIndex + eventsPerPage; // Calcola l'indice di fine
      const eventsOnPage = events.slice(startIndex, endIndex);
      const totalPages = Math.ceil(events.length / eventsPerPage);
      res.render('eventi.ejs', {currentPage: page, totalPages, eventsOnPage, aut:true, type: req.user.type, admin: false, email: req.user.email});
    }catch(error){
      res.render('error.ejs', {message: error});
    }
    
  }
  // se non ha eseguito il login viene rimandato a quella pagina
  else{
    res.redirect('/login');
  }
});

router.get('/:eventId', async (req, res) => {
    const eventId = req.params.eventId; // Ottieni l'ID dell'evento dai parametri dell'URL
    // controllo che chi ha fatto l'evento non sia bannato
    try{
      const isBanned = await LocalDao.CheckBanLocalEvent(eventId);
      if(isBanned)
      {
        res.redirect('/');
      }
      // altrimenti
      else
      {
        // estraggo tutti i dettagli dell'evento che ho trovato
        const eventDetails = await EventDao.getEventByID(eventId);
        // conto i partecipanti dell'evento che sto considerando
        const countPart = await EventDao.getCountPart(eventId);
        if(req.isAuthenticated())
          {
          // la pagina può essere visualizzata solo dagli utenti oppure dal locale che ha creato
          // l'evento sesso
            if(req.user.type !== 'local' || req.user.email === await EventDao.getFounder(eventId))
            {
              // se chi ha richiesto e' autenticato mostro una certa cosa
              const user = req.user.email;
              // ricavo la partecipazione dell'evento (serve per mostrare dei button diversi in base
              // all'esito)
              const partecipazione = await EventDao.getPartecipazioneOfUser(user, eventId);
              // pagina in caso sia un utente
              if(req.user.type === 'user')
              {
                const admin = req.user.admin;
                res.render('evento.ejs', {countPart, eventDetails, partecipazione, email: user, admin, aut:true, type: req.user.type});
              }
              // pagina in caso sia il locale che ha creato l'evento
              else
              {
                res.render('evento.ejs', {countPart, eventDetails, partecipazione, email: user, admin: false, aut:true, type: req.user.type});
              }
            }
            else
              res.redirect("/"); 
          }
      // altrimenti, mostro altro
        else
        {
          res.render('evento.ejs', {countPart, eventDetails, partecipazione:2, email: null, user: null, admin:false, aut:false, type: null});
        }
      } 
      }catch(error){
        console.log(error);
        res.render('error.ejs', {message: error.error});
      }
});

/* 
  questa route serve per trovare i partecipanti rispetto ad un
  evento, identificato da :codiceEvento nel link
*/
router.get('/:codiceEvento/partecipanti', async (req, res) => {
  // estraggo il codiceEvento
  const codiceEvento = req.params.codiceEvento;
  /*
    se l'utente è autenticato ed è un locale posso mostrargli tutto,
    altrimenti (in caso sia un locale oppure non registrato) non è
    autorizzato a vederlo.
  */

  try{
    if(req.isAuthenticated())
    {
      if(req.user.type === 'local')
      {
        // controllo che il locale che sta provando ad accedere alla pagina 
        // sia lo stesso che ha fondato l'evento
        if(req.user.email === await EventDao.getFounder(codiceEvento))
        {
          /*
          estraggo i dettagli dell'evento e poi ricavo gli utenti
          da mostrare a schermo
          */
          const eventDetails = await EventDao.getEventByID(codiceEvento);
          const utenti = await EventDao.getPartecipantiOfEvent(codiceEvento);
          console.log(utenti);
          res.render('utenti.ejs', {info: false, eventDetails, utenti, email: req.user.email, admin: req.user.admin, type: "local", aut: true, data: "Partecipanti"});
        }
        else
        {
          res.redirect('/'); 
        }    
      }
      else
      {
        res.redirect('/');
      }
      
    }
    else
    {
      res.redirect('/');
    }
  }catch(error){
    res.render('error.ejs', {message: error.error});
  }

});

/*
  route che serve per rimuovere un partecipante (identificato nel link da :partecipante)
  da un evento (identificato da :codiceEvento)
*/

router.post('/:codiceEvento/partecipante/:partecipante', async (req, res) => {
  // ricavo il codice dell'evento
  const codiceEvento = req.params.codiceEvento;
  // ricavo il codice del partecipante
  const partecipante = req.params.partecipante;
  console.log(partecipante);

  // l'operazione può essere eseguita solamente se chi la richiede è autenticato
  if(req.isAuthenticated())
  {
    // se il locale è quello che ha creato l'evento può procedere
    if(req.user.email === await EventDao.getFounder(codiceEvento))
    {
      try{
        await EventDao.RimuoviPartecipante(partecipante, codiceEvento);
        // rimando sulla pagina in cui sono mostrati i partecipanti dell'evento
        res.redirect('/eventi/'+codiceEvento+'/partecipanti');
      }
      catch(error){
        console.log(error);
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nella richiesta.'});
      }
    }
    // altrimenti si viene reinderizzati alla pagina principale
    else
      res.redirect('/'); 
  }
  // altriementi si viene reinderizzati alla pagina principale
  else
  {
    res.redirect('/');
  }
});

/*
  route che serve per rimuovere un determinato evento, identificato
  dal link in :eventId
*/
router.post('/:eventId/rimuovi', async (req, res) => {
  try 
      {
        const eventId = req.params.eventId;
        await EventDao.RimuoviEvento(eventId);
        if(req.user.admin){
          res.redirect('/');
        }
        else
          res.redirect('/eventi');

      } 
      catch (error) 
      {
        console.log(error);
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nella rimozione dell\'evento.'});
      }
});

module.exports = router;