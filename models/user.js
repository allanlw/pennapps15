var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
    id: String,
    username: String,
    password: String,
    email: String,
    firstName: String,
    lastName: String,
    bitCoin: {type : Number, default : 0}
});

/*
This is the same as:
var mongoose = require('mongoose');
Schema = mongoose.Schema;

var User = new Schema({
	id: String,
	username: String,
	password, String,
	email: String,
	firstName: String,
	lastName: String,
	bitCoin: {type: Number, default: 0}	
})

modules.exports = mongoose.model("users", Schema);
*/
