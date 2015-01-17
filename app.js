var express = require('express.io');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// setting up mongo and monk
/*
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/accounts');
*/

// Mongoose API connection
var dbConfig = require('./db');
var mongoose = require('mongoose');
// Using mongoose to connect to our db
// We refer to db.js's module export with the url reference to a local accounts usercollection
mongoose.connect(dbConfig.url);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Setting up passport
var passport = require('passport');
var expressSession = require('express-session');
// Secret key
app.use(expressSession({
    secret: 'mySecretKey',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Using flash to display alert messages in session
var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

var routes = require('./routes/index')(passport);
// var users = require('./routes/users');
var ioroutes = require('./routes/io');
app.use('/', routes);
// app.use('/users', users);

app.http().io();

// Code for monk that allows our db to be accessibel to our router
/*
app.use(function (req, res, next){
    req.db = db;
    next();
});
*/

// Add all the socket.io routes to the app
ioroutes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
