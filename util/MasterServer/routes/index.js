var http = require('http');
var uuid = require('node-uuid');
var request = require('request');
var querystring = require('querystring');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
    var data = {
    script: "var x = 0; for(i = 0, x = 0; i < input.max; i++) { x+= i*i; } return x;",
    input: JSON.stringify({max: 100000000 * Math.random()}),
    url: 'http://localhost:4500/getMaster'
  };
    request.post(
    'http://localhost:3000/postMaster',
    { json: data },
    function (error, response, body) {
        console.log(body);
	});
});

router.post('/getMaster', function(req, res) {
  //res.render('test', { title: 'Client' });
  console.log(req.body);
});

module.exports = router;
