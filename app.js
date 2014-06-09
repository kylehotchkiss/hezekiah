//
// Illuminate Nations - DonateServ v0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var environment = process.env.NODE_ENV || 'development';

if ( environment === "production" ) {
    require('newrelic');
}

var swig = require('swig');
var flash = require('connect-flash');
var google = require('passport-google').Strategy;
var express = require('express');
var passport = require('passport');

var session = require('express-session');
var compress = require('compression');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var meta = require('./package.json');
var config = require('./config.json');
var database = require('./models');


//
// Express Setup
//
var app = express();

app.use(compress());
app.use(bodyParser());
app.use(cookieParser());
app.use(session({ secret: process.env.DS_COOKIE_SECRET, cookie: { maxAge: 3600000 }}));
app.use('/assets', express.static('public'));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

if ( environment === "development" ) {
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
app.get('/', function( req, res ) {
    res.redirect( config.organization.url );
});


// Detectify
app.get('/aadd69545f5d08cccbd8ff2f46c7144e.txt', function( req, res ) {
    res.send("detectify")
});


//
// App Status
//
app.get("/status", function(req, res) {
    res.json({
        status: "online",
        timestamp: new Date().getTime(),
        server: meta.name + " v" + meta.version,
    });
})


//
// App Routing
//
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));
app.use('/donate', require('./routes/donate'));


//
// Start it UP!
// Schema Lock - 5/2/14 - DO NOT FORCE, USE MIGRATE
// database.sequelize.sync();
//

app.listen(process.env.PORT || 5000);
console.log(meta.name + " v" + meta.version);
