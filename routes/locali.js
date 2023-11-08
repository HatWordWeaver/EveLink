'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const LocalDao = require('../models/local-dao');
const {check, validationResult} = require('express-validator');
const UserDao = require('../models/user-dao');

router.use(express.static(path.join(__dirname, '../public')));
router.use(express.urlencoded({extended: false}));

/*
  route GET che serve per mostrare i locali presenti all'interno del
  database. Possono accederci solamente gli utenti considerati admin
*/

router.get('/', async (req, res) => {
    // se il richiedente e' registrato
    if(req.isAuthenticated())
    {
      // se il richiedente e' admin può visualizzare i locali
      if(req.user.admin){
        const locals = await UserDao.UserLocals();
        res.render('locali.ejs', {locals, aut: true, type: req.user.type, admin:true});
        // altrimenti rimandiamo al menù principale
      }else{
        res.redirect('/');
      }
    }
    // rimandiamo alla schermata principale se l'utente non è registrato
    else
    {
        res.redirect('/');
    }
})

/*
  route GET per richiedere una visualizzazione completa di un locale specifico,
  identificato da :localId univoco. Questa azione può essere acceduta da qualsiasi
  tipologia di utente
*/
router.get('/:localId', async (req, res) => {
    
  const localId = req.params.localId;
  const localDetails = await LocalDao.getLocalById(localId);
  if(localDetails != null)
  {
     /*
       la differenza maggiore per cui uso l'if logico è dovuta al fatto che per utenti
       diversi è necessario mostrare diverse cose nella navbar, insieme ad eventuali
       possibilità di modificare l'evento.
    */
    if(req.isAuthenticated())
    {
        // se effettivamente il locale è stato trovato
        if(localDetails != null)
        {
          if(localDetails.proprietario == req.user.email)
          {
            res.render('locale.ejs', { localDetails, aut: true, type: req.user.type, admin: false, email: req.user.email});
          }
          else
          {
            res.redirect('/');
          }
        }
        else
          res.redirect('/');
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
    
})

/*
  route GET che serve per mandare a schermo la pagina per modificare un determinato locale,
  identifiato da :/localId. A questa possono accedere solamente il proprietario del locale
  ed eventualmente l'admin
*/
router.get('/:localId/modify', async (req, res) => {
    if(req.isAuthenticated())
    {
      const localId = req.params.localId;
      if((req.user.type == 'local' && req.user.email === localId) || (req.user.type === 'user' && req.user.admin == 1))
      {
        try{
          const localDetails = await LocalDao.getLocalById(localId);
          if(req.user.type === 'user')
          {
            res.render('insert_locale.ejs', {failure: false, insert: false, localDetails, aut: true, type: req.user.type, admin: req.user.admin, email: req.user.email});
          }
          else
          {
            res.render('insert_locale.ejs', {failure: false, insert: false, localDetails, aut: true, type: req.user.type, admin: false, email: req.user.email});
          }
        }catch(error){
          res.render('error.ejs', {message: error.error});
        }
      }
      else
      {
        res.redirect('/');
      }  
    }
    else
    {
        res.redirect('/login');
    }
})

/*
  Questa route POST serve per rimuovere il ban di un utente locale in particolare,
  identificato dal :localId
*/

router.post('/rimuoviBan/:localId', async (req, res) => {
  const localId = req.params.localId;
  try{
    await LocalDao.RemoveBan(localId);
    res.redirect('/locali');

  }catch(error){
    res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'operazione di sban.'});
  }
})

/*
  Questa route POST serve per bannare un utente locale in particolare,
  identificato dal :localId
*/

router.post('/bannaLocale/:localId', async (req, res) => {
  const localId = req.params.localId;
  try{
    await LocalDao.AddBan(localId);
    res.redirect('/locali');

  }catch(error){
    console.log(error);
    res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'operazione di ban.'});
  }
})

/*
  Questa route POST serve per modificare i dettagli di un account locali quali il
  nome, l'indirizzo, la citta, il CAP e la provincia. Non vengono quindi toccati
  i dati sensibili quali email e password.
*/

router.post('/:localId/modify', [
    check('nomeLocale').notEmpty().withMessage('Inserisci un nome!'),
    check('indirizzoLocale').notEmpty().withMessage('Inserisci un indirizzo!'),
    check('cittaPaese').notEmpty().withMessage('Inserisci un paese o una citta!'),
    check('CAPLocale').notEmpty().withMessage('Inserisci un CAP!'),
    check('provinciaLocale').notEmpty().withMessage('Inserisci una provincia!'),
  ], async (req, res) => {
    const errors = validationResult(req);
    if(req.isAuthenticated())
    {
      if(req.user.type === 'local' || (req.user.type === 'user' && req.user.admin == 1))
      {
        if (!errors.isEmpty()) {
          const localId = req.params.localId;
          const localDetails = await LocalDao.getLocalById(localId);
          res.render('insert_locale.ejs', {failure: true, error: errors.errors[0].msg, localDetails, insert: false, aut: true, type: req.user.type, admin: req.user.admin, email: req.user.email});
          // *NOTA* inserire anche qui un div di alert
        } 
        else 
        {
          try 
          {
            await LocalDao.ModifyLocal(req.params.localId, req.body.nomeLocale, req.body.indirizzoLocale, req.body.cittaPaese, req.body.CAPLocale, req.body.provinciaLocale);
            res.redirect('/locali/' + req.params.localId);
          } 
          catch (error) 
          {
            console.log(error);
            res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nella modifica del locale.'});
          }
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
  });

/*
  Questa route serve per ricercare un locale specifico dalla schermata
  dell'admin.
*/

router.post('/ricercaLocale' ,[
  check('stringaRicerca').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.redirect('/locali');
  }
  else
  {
    if(req.isAuthenticated())
    {
      if(req.user.type === 'user' && req.user.admin == 1)
      {
        const search = '%' + req.body.stringaRicerca + '%';
        const locals = await LocalDao.searchLocal(search);
        res.render('locali.ejs', {locals, aut: true, type:'user', admin:true});
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
})


module.exports = router;