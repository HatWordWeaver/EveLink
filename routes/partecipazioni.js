'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const EventDao = require('../models/events-dao');
const {check, validationResult} = require('express-validator');

router.use(express.static(path.join(__dirname, '../public')));

/*
  Questa route GET mostra tutti gli eventi per cui un utente ha deciso di partecipare
  Un utente non loggato nel sito non può accedere a questa pagina
*/

router.get('/', async (req, res) => {
  const eventsPerPage = 12;
    if(req.isAuthenticated())
    {
      if(req.user.type === 'user')    
      {
      const events = await EventDao.getEventsOfUserPart(req.user.email);
      const page = parseInt(req.query.page) || 1; // Numero di eventi da visualizzare per pagina
      const startIndex = (page - 1) * eventsPerPage; // Calcola l'indice di inizio
      const endIndex = startIndex + eventsPerPage; // Calcola l'indice di fine
      const eventsOnPage = events.slice(startIndex, endIndex);
      const totalPages = Math.ceil(events.length / eventsPerPage);
      res.render('eventi.ejs', {currentPage: page, totalPages, eventsOnPage, aut: true, type: req.user.type, admin: req.user.admin, email: req.user.email});
      }
      else
        res.redirect('/');
    }
    else
    {
      res.redirect('/');
    }


  })

/*
  Questa route POST serve per ricercare un partecipante all'interno del database.
  Il partecipante viene inserito nella pagina .ejs e viene ricavato da req.body.stringaRicerca.
  L'evento da cercare invece si trova nel link come :eventId
*/

router.post('/:eventId/ricercaPartecipante', [
  check('stringaRicerca').notEmpty()
 ],async (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
    res.redirect('/eventi/' + req.params.eventId + '/partecipanti');
    }else{
      if(req.isAuthenticated())
    {
      const eventId = req.params.eventId;
      if(req.user.type === 'local' && req.user.email === await EventDao.getFounder(eventId))
      {
        const partecipante = '%' + req.body.stringaRicerca + '%';
        const eventDetails = await EventDao.getEventByID(eventId);
        const user = await EventDao.getUserFromEvent(partecipante, eventId);
        console.log(user);
        res.render('utenti.ejs', {info: false, eventDetails, utenti: user, email: req.user.email, admin: req.user.admin, type:req.user.type, aut: true, data: "Partecipante"});
      }
      else
       res.redirect('/'); 
    }
    else
    {
      res.redirect('/');
    }
  }
})

/*
  Questa route serve per rimuovere o aggiungere la prenotazione a un determinato
  evento. :state è necessario per decidere se bisogna rimuovere o aggiungere.
*/
router.post('/:eventId/:state', async (req, res) => {
  const eventId = req.params.eventId;
  const userInEvent = req.params.state;

  if(userInEvent === "true") // rimuovi prenotazione
  {
    try 
      {
        const user = req.user.email;
        await EventDao.RimuoviPartecipante(user, eventId);
        res.redirect('/eventi/' + eventId);
      } 
      catch(error) 
      {
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nella rimozione della prenotazione.'});
      }
  }
  else // aggiungi prenotazione
  {
    try 
    {
      const user = req.user.email;
      await EventDao.InsertPartecipante(user, eventId);
      res.redirect('/eventi/' + eventId);
    } 
    catch (error) 
    {
      res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'inserimento della prenotazione.'});
    }
  }
})

module.exports = router;