var mongoose = require('mongoose');

module.exports = mongoose.model('Job', {
	id: String,
	username: String,
	password: String,
	script: String,
	input: String,
	url: String
});