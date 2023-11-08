'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const {check, validationResult} = require('express-validator');

router.use(express.static(path.join(__dirname, '../public')));

// funzione GET per la pagina contattaci
router.get('/', (req, res) => {
    if(req.isAuthenticated())
    {
        res.render('contattaci.ejs', {failure: false, aut: true, type: req.user.type, admin: req.user.admin, email: req.user.email});
    }
    else
    {
        res.render('contattaci.ejs', {failure: false, aut: false, type: null, admin:false, email: null});
    }

})

router.post('/', [
    //check('tipoProblema').notEmpty().withMessage('Inserisci una tipologia di problema!'),
    check('email').notEmpty().withMessage('Inserisci una email!'),  
    check('problemaText').notEmpty().withMessage('Inserisci una descrizione al tuo problema!'),
    ], async (req, res) => {
    // estraggo gli errori che ottengo dai check
    const errors = validationResult(req);
    // controllo che chi richiede sia effettivamente autenticato nel server
    // e inoltre che sia anche un locale
  
      // se ci sono errori li mando a schermo nella console e non faccio eseguire nulla
    if (!errors.isEmpty())
    {
        if(req.isAuthenticated())
        {
            res.render('contattaci.ejs', {failure: true, error: errors.errors[0].msg, aut: true, type: req.user.type, admin: req.user.admin, email: req.user.email});
        }
        else
        {
            res.render('contattaci.ejs', {failure: true, error: errors.errors[0].msg, aut: false, type: null, admin:false, email: null});
        }
    }
    else
    {
        console.log('richiesta inviata!');
        res.redirect('/');
    } 
})

module.exports = router;