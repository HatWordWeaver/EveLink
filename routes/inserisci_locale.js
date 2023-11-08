'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const {check, validationResult} = require('express-validator');
const LocalDao = require('../models/local-dao');

router.use(express.static(path.join(__dirname, '../public')));
router.use(express.urlencoded({extended: false}));


/*
  route POST che serve per registrare un utente locale all'interno del database
  *NOTA* fai qualche controllo in più con check
*/
router.post('/', [
    check('email').notEmpty().withMessage('Email obbligatoria!'),
    check('password').isLength({ min: 8 }).withMessage('La Password deve avere almeno 8 caratteri'),
    check('nomeLocale').notEmpty().withMessage('Inserisci un nome!'),
    check('indirizzoLocale').notEmpty().withMessage('Inserisci un indirizzo!'),
    check('cittaPaese').notEmpty().withMessage('Inserisci un paese o una citta!'),
    check('CAPLocale').isLength({ max: 5}).notEmpty().withMessage('Inserisci un CAP!'),
    check('provinciaLocale').notEmpty().withMessage('Inserisci una provincia con massimo 2 caratteri!'),
  ], async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      res.render("insert_locale.ejs", 
      {
        failure: true, 
        error: error.errors[0].msg, 
        insert: true, 
        aut: false, 
        type: null, 
        admin: false, 
        login: false, 
        email: false,
        insertedMail: req.body.email,
        insertedPassword: req.body.password,
        insertedNomeLocale: req.body.nomeLocale,
        insertedIndirizzoLocale: req.body.indirizzoLocale,
        insertedCittaPaese: req.body.cittaPaese,
        insertedCAPLocale: req.body.CAPLocale,
        insertedProvinciaLocale: req.body.provinciaLocale
      });
    } 
    else 
    {
      try 
      {
        await LocalDao.registerLocal(req.body.email, req.body.password, req.body.nomeLocale, req.body.indirizzoLocale, req.body.cittaPaese, req.body.CAPLocale, req.body.provinciaLocale);
        res.redirect('/');
      } 
      catch (error) 
      {
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'inserimento del locale.'});
      }
    }
  });





module.exports = router;