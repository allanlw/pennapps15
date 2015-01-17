var express = require('express');
var queue = require('../lib/queue');
var request = require('request');
var router = express.Router();

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
    res.render('index', { title: 'Counter' });
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
      res.render('signup', { message: req.flash('message') });
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
  })

  /* Logout */
  router.get('/signout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  // POST url, javascript files, etc
	router.post('/postMaster', function(req, res){
		console.log(req.body);
		queue.enqueue(req.body);
		//console.log(queue.size());
		//res.render('client', {title: 'master'});
	});

	// POST results to master
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


  // module.exports = router;
  return router;
}
