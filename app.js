//
// Illuminate Nations - DonateServ v.1
// Copyright 2013 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//
//


var swig = require('swig');
var express = require('express');
var flash = require('connect-flash');
var google = require('passport-google').Strategy;
var passport = require('passport');

var config = require('./config.json');
//var helpers = require('./helpers.js');
var database = require('./models');



//
// Express Setup
//
var app = express();

app.configure(function() {
	app.locals({ config: config });

    app.engine('html', swig.renderFile);

    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');

    app.use(express.compress());
    app.use(express.json());
	app.use(express.urlencoded());
    app.use(express.cookieParser());
    app.use(express.cookieSession({ secret: process.env.DS_COOKIE_SECRET, cookie: { maxAge: 60 * 60 * 1000 }}));
    app.use(flash());

    app.use(passport.initialize());
    app.use(passport.session());

    swig.setDefaults({ autoescape: false });

    app.use('/assets', express.static('assets'));
});

if ( app.get("env") === "development" ) {
    app.set('view cache', false);
    swig.setDefaults({ cache: false });
}


//
// Set CORS to set access domain
//
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", config.access.domain);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    next();
});


//
// Redirect slash to org URL
//
app.get('/', function(req, res) {
    res.redirect(config.organization.url);
});


//
// App Status
//
app.get("/status", function(req, res) {
    res.json({
        time: new Date().getTime(),
        status: "online"
    });
})


//
// App Routing
//
//app.use('/book')
app.use('/donate', require('./routes/donate'));
app.use('/admin', require('./routes/admin'));


//
// Start it UP!
//
database.sequelize.sync().complete(function( error ) {
    if ( error ) {
        console.log
    } else {
        app.listen(process.env.PORT || 5000);
    }
});
