'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const EventDao = require('../models/events-dao');

router.use(express.static(path.join(__dirname, '../public')));
router.use(express.urlencoded({extended: false}));

router.get('/', async (req, res) => {
    const events = await EventDao.ProssimiEventi();
    if(req.isAuthenticated())
        res.render('index.ejs', {events, query: false, stamp: true, email: req.user.email, locale: req.user.locale, admin: req.user.admin, aut: true})
    else
        res.render('index.ejs', {events, query: false, stamp: true, email: false, locale: false, admin: false, aut: false})
})

module.exports = router;