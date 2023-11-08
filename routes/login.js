'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');

router.use(express.static(path.join(__dirname, '../public')));


// Pagina di accesso

router.get('/', function (req, res) {
    // se sono autenticato vengo rimandato alla home, non devo loggarmi di nuovo
    if(req.isAuthenticated())
    {
        res.redirect("/");
    }
    // mostro la schermata di login
    else
    {
        res.render('input.ejs', {failure: false, type: null, login: true, aut: false, admin: false});
    }
});

/*
  questa route POST serve per procedere con il login dell'utente
  isLocale e' una variabile che serve per capire con quale metodo
  procedere, visto che utilizzando due database differenti le query
  da fare non possono essere univoche.
*/
router.post('/', function (req, res, next) {

    const isLocale = req.body.boolLocale === 'on';

    // metodo riservato per gli utenti normali, dunque non locali
    if(!isLocale){
      passport.authenticate('user', function (err, user, info) {
        if (err) { return next(err) }
        // se l'utente non è stato trovato, rimando alla schermata con i dati compilati precedentemente
        if (!user) {
          res.render('input.ejs', 
          {
            failure: true, 
            login: true, 
            type:null, 
            message: info.message, 
            aut: false, 
            admin: false,
            insertedMail: req.body.email,
            insertedPassword: req.body.password,
          });
        // se l'utente è bannato, rimando alla schermata con i dati compilati precedentemente
        } else if (user.flag_ban === 1) {
          res.render('input.ejs', 
          {
            failure: true, 
            login: true, 
            type:null, 
            message: info.message, 
            aut: false, 
            admin: false,
            insertedMail: req.body.email,
            insertedPassword: req.body.password,
          });
        } else {
          // Successo, effettua l'accesso
          req.login(user, function (err) {
            if (err) { return next(err); }
            res.redirect('/');
          });
        }
      })(req, res, next);
    // metodo riservato per gli utenti detti locali
    }else{
      passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err) }
        if (!user) {
          // stesse modalità fatte precedentemente con gli utenti, cambia solo il fatto che in questo caso
          // mi sto riferendo solamente agli utenti locali
          res.render('input.ejs', 
          {
            failure: true, 
            login: true, 
            type: null, 
            message: info.message, 
            aut: false, 
            admin: false,
            insertedMail: req.body.email,
            insertedPassword: req.body.password,
          });
        } else if (user.flag_ban === 1) {
          res.render('input.ejs', 
          {
            failure: true, 
            login: true, 
            type: null,
            message: info.message, 
            aut: false, 
            admin: false,
            insertedMail: req.body.email,
            insertedPassword: req.body.password,
            });
        } else {
          console.log('utente locale: ' + user);
          // Successo, effettua l'accesso
          req.login(user, function (err) {
            if (err) { return next(err); }
            res.redirect('/');
          });
        }
      })(req, res, next);
    }
  });
  

module.exports = router;