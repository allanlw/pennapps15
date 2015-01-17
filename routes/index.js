var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/client', function(req, res) {
  res.render('client', { title: 'Client' });
});

/* GET login page. */
router.get('/login', function(req, res) {
  res.render('login', { title: 'Login' });
});

/* GET userlist page. */
router.get('/userlist', function(req, res) {
    var db = req.db;
    var collection = db.get('usercollection');
    collection.find({},{},function(e,docs){
        res.render('userlist', {
            "userlist" : docs
        });
    });
});

module.exports = router;
