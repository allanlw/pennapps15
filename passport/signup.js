var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){

	passport.use('signup', new LocalStrategy({
		// pass entire request to callback
		passReqToCallback : true
	},
	function(req, username, password, done){
		// find a user or create that user
		findOrCreateUser = function(){
			User.findOne({'username' : username}, function(err, user){
				if(err){
					return done(err);
				}
				// if already exists
				if(user){
					return done(null, false, req.flash('message', 'User already exists'));
				}else{
					// create the user
					var newUser = new User();
					// local credentials
					newUser.username = username;
					newUser.password = createHash(password);
					newUser.email = req.param('email');
					newUser.firstName = req.param('firstName');
					newUser.lastName = req.param('lastName');
					//newUser.bitCoin = req.param('bitCoin');

					// save user
					newUser.save(function(err){
						if(err){
							throw err;
						}
						return done(null, newUser);
					});
				}
			});
		};
	// delay and execute next tick of event loop
	process.nextTick(findOrCreateUser);
	})
	);

	// bCrypt is used to create Hash
	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	}
}	

