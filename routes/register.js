'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const UserDao = require('../models/user-dao');
const {check, validationResult} = require('express-validator');

router.use(express.static(path.join(__dirname, '../public')));
router.use(express.urlencoded({extended: false}));

/* 
  questa funzione GET serve per reinderizzare alla pagina input.ejs
*/

router.get('/', (req, res) => {
    if(req.isAuthenticated())
    {
      res.redirect('/');
    }
    else
    {
      res.render('input.ejs', {failure: false, type: null, login: false, aut: false, admin: false});
    }
})

/*
  questa funzione GET serve per registrare un utente locale, reinderizzando sulla pagina
  dove poi potrà essere eseguita una funzione POST
*/

router.get('/locale', async (req, res) => {
  if(req.isAuthenticated())
  {
    res.redirect('/');
  }
  else
  {
    res.render('insert_locale.ejs', {failure: false, insert: true, aut: false, type: null, admin: false, login: false, email: false});
  }
})

/*
  questa funzione POST serve per registrare un utente all'interno del database
*/
router.post('/', [
  check('nome').notEmpty().withMessage('Inserisci un nome!'),
  check('email').notEmpty().withMessage('Inserisci una email!'),
  check('dataNascita').notEmpty().withMessage('Inserisci una data di nascita!'),
  check('cognome').notEmpty().withMessage('Inserisci un cognome!'),
  check('password').isLength({ min: 8 }).withMessage('La Password deve avere almeno 8 caratteri'),
], async (req, res) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    console.log('cant execute');
    console.log(error);
    res.render('input.ejs', 
      {
        type: null, 
        failure: true, 
        message: error.errors[0].msg, 
        login: false, 
        aut: false, 
        admin: false,
        insertedName: req.body.nome,
        insertedMail: req.body.email,
        insertedData: req.body.dataNascita,
        insertedCognome: req.body.cognome,
      });
  } 
  else 
  {
    try
    {
      // setto il valore di admin come false (standard)
      const admin = false;
      const sesso = req.body.sessoUtente;
      await UserDao.registerUser(req.body.nome, req.body.cognome, req.body.email, req.body.password, admin, req.body.dataNascita, sesso);
      res.redirect('/login');
    }
    catch(error)
    {
      console.log(error);
      res.render('input.ejs', 
      {
        type: null, 
        failure: true, 
        message:error,
        login: false, 
        aut: false, 
        admin: false,
        insertedName: req.body.nome,
        insertedMail: req.body.email,
        insertedData: req.body.dataNascita,
        insertedCognome: req.body.cognome,
      });
    }
  }
});


module.exports = router;