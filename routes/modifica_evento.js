'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const EventDao = require('../models/events-dao');
const LocalDao = require("../models/local-dao");
const bodyParser = require('body-parser'); // Importa body-parser
const {check, validationResult} = require('express-validator');

router.use(express.static(path.join(__dirname, '../public')));

router.use(bodyParser.urlencoded({ extended: false }));

// prende un evento passato da "codiceEvento"
router.get('/:codiceEvento', async (req, res) => {
    const codiceEvento = req.params.codiceEvento;

    try{
      const isBanned = await LocalDao.CheckBanLocalEvent(codiceEvento);
      // se il locale e' bannato
      if(isBanned)
      {
        res.redirect('/');
      }
      // altrimenti
      else
      {
        // se il richiedente e' autenticato
        if(req.isAuthenticated())
        {
          try{
            const evento = await EventDao.getEventRawByID(codiceEvento);
            res.render('insert_event.ejs', 
            {
              failure: false,
              insert: false, 
              evento, 
              aut: true, 
              type: req.user.type, 
              admin: false, 
              email: req.user.email
            });
          }catch(error){
            res.render('error.ejs', {message: error});
          }
        }
        // altrimenti torna all'index
        else
        {
          res.redirect('/');
        }
      }
    }catch(error){
      res.render('error.ejs', {message: error.error});
    }
  });

// modifica un determinato evento identificato da "codiceEvento"
router.post('/:codiceEvento', [
  check('nomeEvento').notEmpty().withMessage('Inserisci un nome!'),
  check('dataEvento').notEmpty().withMessage('Inserisci una data!'),  
  check('descrizioneEvento').notEmpty().withMessage('Inserisci una descrizione al tuo evento!'),
  check('genereEvento').notEmpty().withMessage('Inserisci un genere al tuo evento'),
  ], async (req, res) => {
    const errori = validationResult(req);
    if (!errori.isEmpty()) {
      try{
        const codiceEvento = req.params.codiceEvento;
        const evento = await EventDao.getEventRawByID(codiceEvento);
        res.render('insert_event.ejs', 
          {
              failure: true,
              error: errori.errors[0].msg, 
              insert: false, 
              evento, 
              aut: true, 
              type: req.user.type,
              admin: false, 
              email: req.user.email
          });
      }catch(error){
        res.render('error.ejs', {message: error});
      }
    } 
    else 
    {
      try
      {
        const codiceEvento = req.params.codiceEvento;
        await EventDao.UpdateEvent(req.body.nomeEvento, req.body.dataEvento, req.body.descrizioneEvento, codiceEvento, req.body.genereEvento);
        res.redirect('/');
      }
      catch(error)
      {
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nella modifica del\'evento.'});
      }
    }
  })

module.exports = router;