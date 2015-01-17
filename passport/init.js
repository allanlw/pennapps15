var login = require('./login');
var signup = require('./signup');
//var update = require('./update');
var User = require('../models/user');

module.exports = function(passport){
	// serializing and deserializing user instances to support login sessions
	passport.serializeUser(function(user, done) {
	  done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user){
	    done(err, user);
	  });
	});

	login(passport);
	signup(passport);
	//update(passport);
}
