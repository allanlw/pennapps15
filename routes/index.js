var express = require('express');
var queue = require('../lib/queue');
var uuid = require('node-uuid');
var request = require('request');
var router = express.Router();
var User = require('../models/user');
var mandrill = require('node-mandrill')('API KEY');

var isAuthenticated = function (req, res, next){
  return next();
}


// use passport
module.exports = function(passport){
   /* GET front page. */
  router.get('/', isAuthenticated, function(req, res) {
    res.render('front', {user: req.user, title: 'Big Cloud' });
  });

  /* GET run page. */
  router.get('/run', isAuthenticated, function(req, res) {
    res.render('index', {user: req.user, title: 'Counter' });
  });

  /* GET login page. */
  router.get('/login', isAuthenticated, function(req, res) {
    res.render('login', {user: req.user, message: req.flash('message') });
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

  //Both of these endpoints control the upload for scripts and data
  router.get('/deploy', isAuthenticated, function(req, res){
    if(req.session.passport && req.session.passport.user){
      res.render('deploy', { title: 'Deployer', user:req.user });
    } else {
      res.send("Please log in.")
    }
  })

  router.post('/deploy', isAuthenticated, function(req, res){
    if(req.session.passport && req.session.passport.user){
      res.render('deploy', { title: 'Deployed', user:req.user });
      var id = req.session.passport.user; 
      var data = {
      script: req.body.script,
      input: req.body.input, 
      url: 'http://'+req.get("host")+'/results/' + id
      };
      console.log(data);
      request.post(
      'http://'+req.get("host")+'/postMaster',
      { json: data },
      function (error, response, body) {
        console.log(body);
        console.log(error);
      });
    } else {
      console.log("user not logged in");
    }
  });

  //Displays the result of the finished task
  // router.get('/results/:id', function(req,res){
  //   res.render('results', { title: 'Results' });
  //   res.send(req.body);
  // });

  router.post('/results/:id', function(req, res) {
    var id = req.param("id");
    var data = req.body;
    console.log(id + " :" + JSON.stringify(data));
    setTimeout(function() {
      require("../app").io.room("deploy-"+id).broadcast("results", data);
    }, 5000);

    console.log(req.body);
    //send an e-mail to issuer
    mandrill('/messages/send', {
    message: {
        to: [{email: '', name: 'Ash Ketchum'}],
        from_email: 'you@domain.com',
        subject: "Team Rocket",
        text: " Prepare for trouble! Make it double! To protect the world with devastation! To unite all people within our nation! To denounce the evil of truth and love! To extend our reach to the stars above! Jessie! James! Team Rocket blast off at the speed of light! Surrender now or prepare to fight! Meowth. That's right!"
    }
    }, function(error, response)
    {
        //uh oh, there was an error
        if (error) console.log( JSON.stringify(error) );
        //everything's good, lets see what mandrill said
        else console.log(response);
    });
    //res.render('results', { title: 'Results' });
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

