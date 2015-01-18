var express = require('express');
var queue = require('../lib/queue');
var uuid = require('node-uuid');
var request = require('request');
var router = express.Router();
var User = require('../models/user');

var isAuthenticated = function (req, res, next){
  return next();
}

// use passport
module.exports = function(passport){
  
  /* GET home page. */
  router.get('/', isAuthenticated, function(req, res) {
    res.render('index', {user: req.user, title: 'Counter' });
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


  /* GET home page. */
      router.get('/', isAuthenticated, function(req, res) {
    res.render('index', {user: req.user, title: 'Counter' });
  });

  /* GET about page. */
      router.get('/about', isAuthenticated, function(req, res) {
    res.render('about', {user: req.user, title: 'Counter' });
  });

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

  // POST url, javascript files, etc
	router.post('/postMaster', function(req, res){
		var json = {"uuid": uuid.v4(), "script": req.body.script, "input": req.body.input, "url": req.body.url};
		console.log(json);
		queue.enqueue(json);
		//console.log(queue.size());
		//res.render('client', {title: 'master'});
	});

	// POST results to master
	/*
	router.get('/toMaster', function(req, res){
		//hard coded url for now
		var data = {"masterUrl": "/something/here", "javascriptFile": "/thisIsAJSFile"};
		request.post(
	    'http://localhost:4500/getMaster',
	    { json: data},
	    function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            console.log(body)
		    }
		});
		res.render('master', {title: 'master'});
	});
	*/

  // module.exports = router;
  return router;
}

