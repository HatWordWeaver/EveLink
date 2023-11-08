'use strict';

const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const UserDao = require('./models/user-dao');
const EventDao = require('./models/events-dao');
const LocalDao = require('./models/local-dao');
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const contattaciRouter = require('./routes/contattaci');
const eventiRouter = require('./routes/eventi');
const insertEventiRouter = require('./routes/inserisci_eventi');
const inserisciLocaleRouter = require('./routes/inserisci_locale');
const partecipazioneRouter = require('./routes/partecipazioni');
const localiRouter = require('./routes/locali');
const utentiRouter = require('./routes/utenti');
const ricercaRouter = require('./routes/ricerca');
const nextEventiRouter = require('./routes/prossimi_eventi');
const modificaEvento = require('./routes/modifica_evento');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/js', express.static('public/js', { 'Content-Type': 'text/javascript' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'segreto', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/contattaci', contattaciRouter);
app.use('/eventi', eventiRouter);
app.use('/insert-event', insertEventiRouter);
app.use('/insert-local', inserisciLocaleRouter);
app.use('/partecipazioni', partecipazioneRouter);
app.use('/locali', localiRouter);
app.use('/utenti', utentiRouter);
app.use('/ricerca', ricercaRouter);
app.use('/prossimi_eventi', nextEventiRouter);
app.use('/modifica', modificaEvento);



passport.use('user',new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      UserDao.getUserTotally(email, password)
        .then(({user, check}) => {
          if (!user) {
            return done(null, false, { message: 'utente non trovato! Assicurati della correttezza della email.' });
          }

          if (user.flag_ban === 1) {
            return done(null, false, { message: 'la email corrisponde ad un account bannato! Contatta l\'amministratore.' });
          }
  
          if (!check) {
            return done(null, false, { message: 'la password inviata non è corretta!' });
          }
  
          // L'utente è autenticato con successo
          return done(null, user, {userType: 'user'});
        })
        .catch((err) => {
          return done(err);
        });
    })
  );

passport.use('local',new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    LocalDao.getLocalTotally(email, password)
      .then(({locale, check}) => {
        if (!locale) {
          return done(null, false, { message: 'locale non trovato! Assicurati della correttezza della email.' });
        }

        if (locale.ban_flag === 1) {
          return done(null, false, { message: 'la email corrisponde ad un account bannato! Contatta l\'amministratore.' });
        }

        if (!check) {
          return done(null, false, { message: 'la password inviata non è corretta!' });
        }

        // L'utente è autenticato con successo
        return done(null, locale, {userType: 'local'});
      })
      .catch((err) => {
        return done(err);
      });
  })
);

passport.serializeUser((user, done) => {
  // In questa funzione, distingui tra utenti e locali
  if (user.type === 'user') {
    const serializedUser = {
      email: user.email,
      type: user.type
    }
    done(null, serializedUser);
  } else if (user.type === 'local') {
    const serializedUser = {
      email: user.email,
      type: user.type
    }
    done(null, serializedUser);
  } else {
    done(new Error('Tipo utente non valido'));
  }
});

passport.deserializeUser((serializedUser, done) => {
  // Qui effettua la deserializzazione basata sul tipo di utente
  if (serializedUser.type === 'user') {
    UserDao.getUserWithEmail(serializedUser.email)
      .then(({ user, error }) => {
        if (error) {
          return done(error);
        }
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
  } else if (serializedUser.type === 'local') {

    LocalDao.getLocalWithEmail(serializedUser.email)
      .then(({ user, error }) => {
        if (error) {
          return done(error);
        }
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
  } else {
    done(new Error('Tipo utente non valido'));
  }
});

app.get('/', async (req, res) => {
    const events = await EventDao.ProssimiEventi();
    // se il richiedente e' autenticato
    if(req.isAuthenticated())
    {
      // se il richiedente è un locale
      if(req.user.type === 'local')
      {
        res.redirect('/eventi');
      }
      // se invece è un utente qualsiasi
      else
        res.render('index.ejs', {query: false, stamp: true, email: req.user.email, type: req.user.type, events, aut: true, admin: req.user.admin});
    }
    // se il richiedente non è autenticato
    else
    {
      res.render('index.ejs', {query: false, stamp: false, name: null, type: false, events, aut: false, locale: false, admin: false});
    } 
})

app.get('/faq', (req, res) => {
    if(req.isAuthenticated())
    {
      res.render('faq.ejs', {aut: true, type: req.user.type, admin: req.user.admin, email: req.body.email});
    }
    else
    {
      res.render('faq.ejs', {aut: false, type:null, admin:false, email:false})
    }


})

app.post('/logout', function(req, res, next)
{
    req.logout(function(err)
    {
        if(err)
        {
            return next(err);
        }
        res.redirect('/');
    });
});

app.listen(3000);

