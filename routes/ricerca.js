'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const EventDao = require('../models/events-dao');
const {check, validationResult} = require('express-validator');

router.use(express.static(path.join(__dirname, '../public')));
router.use(express.urlencoded({extended: false}));

/*
    funzione ausiliaria per i render
*/
function render_query(page, genereRicerca, events, req, name, res, pages, spec){
    if(req.isAuthenticated())
    {
        console.log(events);
        res.render('search.ejs', {ricerca: spec, currentPage: page, totalPages: pages, search: genereRicerca, query_scelta: name, events, admin: req.user.admin, email: req.user.email, type: req.user.type, aut:true});
    }
        else
        res.render('search.ejs', {ricerca: spec, currentPage: page, totalPages: pages, search: genereRicerca, query_scelta: name, events, admin: false, email: false, type: null, aut: false});
}

/*
    funzione GET per mostrare a schermo i risultati di una determinata query
    si rende necessaria per gestire più pagine di eventi, in caso di molti
    risultati vengono mostrati su pagine diverse.
    La ricerca è suddivisa in "name", "date" e "location".
*/
router.get('/generica/:query/:search', async (req, res) => {
    const eventsPerPage = 12;
    const genereRicerca = req.params.search;
    const stringaRicerca = req.params.query;
    const page = parseInt(req.query.page) || 1; // Numero di eventi da visualizzare per pagina
    const startIndex = (page - 1) * eventsPerPage; // Calcola l'indice di inizio
    const endIndex = startIndex + eventsPerPage; // Calcola l'indice di fine

    switch(genereRicerca){
        case 'name':
            {
                try{
                    const search = '%' + stringaRicerca + '%';
                    const events = await EventDao.RicercaPerNome(search);
                    const eventsOnPage = events.slice(startIndex, endIndex);
                    const totalPages = Math.ceil(events.length / eventsPerPage);
                    render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                }
                catch(error){
                    console.log(error);
                    res.redirect('/');
                }
                break;
            }
        case 'date':
            {
                try{
                    const search = '%' + stringaRicerca + '%';
                    const events = await EventDao.RicercaPerData(search);
                    const eventsOnPage = events.slice(startIndex, endIndex);
                    const totalPages = Math.ceil(events.length / eventsPerPage);
                    render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                }
                catch(error){
                    console.log(error);
                    res.redirect('/');
                }
                break;
            }
        case 'location':
            {
                try{
                    const search = '%' + stringaRicerca + '%';
                    const events = await EventDao.RicercaPerLocale(search);
                    const eventsOnPage = events.slice(startIndex, endIndex);
                    const totalPages = Math.ceil(events.length / eventsPerPage);
                    render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                }
                catch(error){
                    console.log(error);
                    res.redirect('/');
                }
                break;
            }
        default:
            {
                res.redirect('/');
            }
    }

})

/*
    funzione POST per prendere i dati dal database
    In caso di molti eventi i risultati vengono mostrati su pagine diverse.
    La ricerca è suddivisa in "name", "date" e "location".
*/

router.post('/', [
        check('stringaRicerca').notEmpty().withMessage('Inserisci qualcosa da cercare')
    ],async (req, res) => {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            res.redirect('/');
        }else{
            const eventsPerPage = 12;
            const genereRicerca = req.body.genereRicerca;
            const stringaRicerca = req.body.stringaRicerca;
            const page = parseInt(req.query.page) || 1;
            const startIndex = (page - 1) * eventsPerPage; // Calcola l'indice di inizio
            const endIndex = startIndex + eventsPerPage; // Calcola l'indice di fine
        
            switch(genereRicerca){
                case 'name':
                    {
                        try{
                            const search = '%' + stringaRicerca + '%';
                            const events = await EventDao.RicercaPerNome(search);
                            const eventsOnPage = events.slice(startIndex, endIndex);
                            const totalPages = Math.ceil(events.length / eventsPerPage);
                            render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                        }
                        catch(error){
                            console.log(error);
                            res.redirect('/');
                        }
                        break;
                    }
                case 'date':
                    {
                        try{
                            const search = '%' + stringaRicerca + '%';
                            const events = await EventDao.RicercaPerData(search);
                            const eventsOnPage = events.slice(startIndex, endIndex);
                            const totalPages = Math.ceil(events.length / eventsPerPage);
                            render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                        }
                        catch(error){
                            console.log(error);
                            res.redirect('/');
                        }
                        break;
                    }
                case 'location':
                    {
                        try{
                            const search = '%' + stringaRicerca + '%';
                            const events = await EventDao.RicercaPerLocale(search);
                            const eventsOnPage = events.slice(startIndex, endIndex);
                            const totalPages = Math.ceil(events.length / eventsPerPage);
                            render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                        }
                        catch(error){
                            console.log(error);
                            res.redirect('/');
                        }
                        break;
                    }
                default:
                    {
                        res.redirect('/');
                    }
            }
        }
})

/*
    route POST per una ricerca specifica, che viene utilizzata dall'utente locale
    quando deve cercare i suoi eventi (solamente per nome).
*/

router.post('/specifica', [
    check('stringaRicerca').notEmpty().withMessage('Inserisci qualcosa da cercare')
], async (req, res) => {
    const error = validationResult(req);
        if (!error.isEmpty()) {
            res.redirect('/');
        }else{
            if(req.isAuthenticated())
            {
                if(req.user.type === 'local')
                {
                    const eventsPerPage = 12;
                    const nomeRicerca = req.body.stringaRicerca;
                    const page = parseInt(req.query.page) || 1;
                    const startIndex = (page - 1) * eventsPerPage; // Calcola l'indice di inizio
                    const endIndex = startIndex + eventsPerPage; // Calcola l'indice di fine
                    const locale = req.user.email;
                    const genereRicerca = req.body.genereRicerca;
        
                    switch(genereRicerca){
                        case 'name':
                            {
                                try{
                                    const search = '%' + nomeRicerca + '%';
                                    const events = await EventDao.RicercaPerNomeSpecifica(locale, search);
                                    const eventsOnPage = events.slice(startIndex, endIndex);
                                    const totalPages = Math.ceil(events.length / eventsPerPage);
                                    render_query(page, genereRicerca, eventsOnPage, req, nomeRicerca, res, totalPages, false);
                                }
                                catch(error){
                                    console.log(error);
                                    res.render('error.ejs', {message: 'Si è verificato un errore inaspettato'});
                                }
                                break;
                            }
                        case 'date':
                            {
                                try{
                                    const search = '%' + nomeRicerca + '%';
                                    const events = await EventDao.RicercaPerDataSpecifica(locale, search);
                                    const eventsOnPage = events.slice(startIndex, endIndex);
                                    const totalPages = Math.ceil(events.length / eventsPerPage);
                                    render_query(page, genereRicerca, eventsOnPage, req, nomeRicerca, res, totalPages, false);
                                }
                                catch(error){
                                    console.log(error);
                                    res.render('error.ejs', {message: 'Si è verificato un errore inaspettato'});
                                }
                                break;
                            }
                        default:
                            {
                                res.redirect('/');
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
        }
})

router.get('/specifica/:query/:search', async (req, res) => {
    if(req.isAuthenticated())
    {
        if(req.user.type === 'local')
        {
            const eventsPerPage = 12;
            const genereRicerca = req.params.search;
            const stringaRicerca = req.params.query;
            const page = parseInt(req.query.page) || 1;
            const startIndex = (page - 1) * eventsPerPage; // Calcola l'indice di inizio
            const endIndex = startIndex + eventsPerPage; // Calcola l'indice di fine
            const locale = req.user.email;
        
            switch(genereRicerca){
                case 'name':
                    {
                        try{
                            const search = '%' + stringaRicerca + '%';
                            const events = await EventDao.RicercaPerNomeSpecifica(locale, search);
                            const eventsOnPage = events.slice(startIndex, endIndex);
                            const totalPages = Math.ceil(events.length / eventsPerPage);
                            render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                        }
                        catch(error){
                            console.log(error);
                            res.redirect('/');
                        }
                        break;
                    }
                case 'date':
                    {
                        try{
                            const search = '%' + stringaRicerca + '%';
                            const events = await EventDao.RicercaPerDataSpecifica(locale, search);
                            const eventsOnPage = events.slice(startIndex, endIndex);
                            const totalPages = Math.ceil(events.length / eventsPerPage);
                            render_query(page, genereRicerca, eventsOnPage, req, stringaRicerca, res, totalPages, true);
                        }
                        catch(error){
                            console.log(error);
                            res.redirect('/');
                        }
                        break;
                    }
                default:
                    {
                        res.redirect('/');
                    }
            }
        }
        else
            res.redirect('/');
    }
    else
        res.redirect('/');
    
})



module.exports = router;