'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const UserDao = require('../models/user-dao');
const {check, validationResult} = require('express-validator');

router.use(express.static(path.join(__dirname, '../public')));
router.use(express.urlencoded({extended: false}));

/*
    questa route GET serve per mostrare tutti gli account registrati
    all'interno del database. Può accedervi solamente l'admin.
*/

router.get('/', async (req, res) => {
    if(req.isAuthenticated())
    {
        if(req.user.admin)
        {
            const utenti = await UserDao.getUsersRegistered();
            res.render('utenti.ejs', {info: true, data: 'Account registrati', email: req.user.email, admin: true, type: req.user.type, utenti, aut: true});
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
    route POST che serve per ricercare un utente all'interno di una pagina che
    visualizza tutti gli utenti presenti all'interno del database. Può compiere
    questa azione solamente un admin.
*/

router.post('/ricercaUtente', [
    check('stringaRicerca').notEmpty()
    ],async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    res.redirect('/utenti');
    }else{
        if(req.isAuthenticated())
        {
            if(req.user.admin){
                const search = '%' + req.body.stringaRicerca + '%';
                const utenti = await UserDao.getUsersRicerca(search);
                res.render('utenti.ejs', {info: true, data: 'Risultati ricerca per : \' '+req.body.stringaRicerca+'\'', email: req.user.email, admin: true, type:"user", utenti, aut: true});
            }
            else
                res.redirect('/');
        }
        else
        {
            res.redirect('/');
        }
        }
    });


/*
    questa route POST serve per bannare un utente dal sito.
*/

router.post('/bannaUtente/:userId', async (req, res) => {
    try{
        const userId = req.params.userId;
        await UserDao.BannaUtente(userId);
        res.redirect('/utenti');

    }catch(error)
    {
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'operazione di ban.'});
    }
})

/*
    questa route POST serve per rimuovere il ban di un utente dal sito.
*/

router.post('/rimuoviBan/:userId', async (req, res) => {
    try{
        const userId = req.params.userId;
        await UserDao.RimuoviBanUtente(userId);
        res.redirect('/utenti');

    }catch(error)
    {
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'operazione di sban.'});
    }
})

router.post('/rimuoviAdmin/:userId', async (req, res) => {
    try{
        const userId = req.params.userId;
        await UserDao.rimuoviAdminUtente(userId);
        res.redirect('/utenti');

    }catch(error)
    {
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'operazione di ban.'});
    }
})

/*
    questa route POST serve per rimuovere il ban di un utente dal sito.
*/

router.post('/aggiungiAdmin/:userId', async (req, res) => {
    try{
        const userId = req.params.userId;
        await UserDao.aggiungiAdminUtente(userId);
        res.redirect('/utenti');

    }catch(error)
    {
        console.log(error);
        res.render('error.ejs', {message: 'Si è verificato un errore inaspettato nell\'operazione di sban.'});
    }
})

module.exports = router;