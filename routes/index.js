var express = require('express');
var router = express.Router();
var User = require('../models/user');

var isAuthenticated = function (req, res, next){
  // go next() if user is authenticated
  if(req.isAuthenticated()){
    return next();
  }
  // else
  res.redirect('/login');
}

// use passport
module.exports = function(passport){
  
  /* GET home page. */
  router.get('/', function(req, res) {
    res.render('index', { title: 'Big Cloud' });
  });

  router.get('/client', function(req, res) {
    res.render('client', { title: 'Client' });
  });

  /* GET login page. */
  router.get('/login', function(req, res) {
    res.render('login', { message: req.flash('message') });
  }); 

  /* Login POST */
  router.post('/login', passport.authenticate('login', {
    successRedirect:'/home',
    falureRedirect:'/login',
    falureFlash : true
  }));

  /* GET userlist page. */
  /*
  router.get('/userlist', function(req, res) {
      var db = req.db;
      var collection = db.get('usercollection');
      collection.find({},{},function(e,docs){
          res.render('userlist', {
              "userlist" : docs
          });
      });
  });
  */

  /* GET signup page. */
  router.get('/signup', function(req, res) {
      res.render('signup', { message: req.flash('message')});
  });

  /* Signup POST */
  router.post('/signup', passport.authenticate('signup', {
    successRedirect: '/home',
    failureRedirect: '/signup',
    failureFlash: true
  }));

  /* GET Home Page */
  router.get('/home', isAuthenticated, function(req, res){
    res.render('home', {user: req.user });
  });

  /* GET Home Page post */
  /*
  router.post('/home', passport.authenticate('update', {
    successRedirect: '/home',
    failureRedirect: '/home',
    failureFlash: true
  }));
  */

  /*
  router.post('/home', function(req, res){
    res.render('home', {bitCoin: req.param('bitCoin')});
  });
  */

  /* Post Home Page */
  router.post('/home', function(req, res){
    User.findOne({'username' : req.user.username },
    function(err, user){
        if (err)
            return done(err);
        user.bitCoin = req.param("bitCoin");
        user.save(function(err, user){
            if(err){
                throw err;
            }
            res.render('home', {'user' : user});
        });
    });
  });
  

  /* Logout */
  router.get('/signout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  // module.exports = router;
  return router;
}

