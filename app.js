//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

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
var environment = process.env.NODE_ENV || 'development';

//
// Express Setup
//
var app = express();

//app.engine('html', swig.renderFile);
//app.set('view engine', 'html');
//app.set('views', __dirname + '/views');

app.use(compress());
app.use(bodyParser());
app.use(cookieParser());
app.use(session({ secret: process.env.DS_COOKIE_SECRET, cookie: { maxAge: 3600000 }}));
app.use('/assets', express.static('public'));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

//swig.setDefaults({ autoescape: false }); // ??

if ( environment === "development" ) {
    app.set('view cache', false);
    swig.setDefaults({ cache: false });
}


//
// Set CORS to set access domain
//
app.all('/*', function(req, res, next) {
    //res.header("Access-Control-Allow-Origin", config.access.domain);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    next();
});


//
// Redirect slash to org URL
//
app.get('/', function(req, res) {
    res.redirect( config.organization.url );
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
//app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));
app.use('/donate', require('./routes/donate'));



//
// Start it UP!
// Schema Lock - 4/22/14 - DO NOT FORCE, USE MIGRATE
// database.sequelize.sync();
//

app.listen(process.env.PORT || 5000);
console.log(meta.name + " v" + meta.version);
