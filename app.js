//
// Illuminate Nations - DonateServ v.1
// Copyright 2013 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//
// helpers - sendEmail, subscribeEmail, recordDonation
//
//

require('cloud/swig.js');
console.log( exports );

var ejs = require("ejs");
var express = require('express');
var Stripe = require('stripe');
var helpers = require('cloud/helpers.js');
var parseHTTPS = require('parse-express-https-redirect');
var parseSession = require('parse-express-cookie-session');


// Organizational Variables
var organizationName = "Illuminate Nations";
var organizationURL = "http://www.illuminatenations.org"

// DonateServ Variables
var programName = "Illuminate Nations DonateServ";
var programVersion = "v.1";


//
// SETUP
//
Parse.Cloud.useMasterKey();
var app = express();
 
// EJS options
app.set('views', 'cloud/views');
app.set('view engine', 'ejs');
//ejs.open = "{{";
//ejs.close = "}}";

app.use(function(req, res, next) {
    res.locals.myVar = 'myVal';
    res.locals.myOtherVar = 'myOtherVal';
    next();
});

// Express Options
app.use( parseHTTPS() ); // Force HTTPS
app.use( express.bodyParser() ); 
app.use( express.methodOverride() );
app.use( express.cookieParser('PhTMAVcZERnVTQur94QMRI4TwBEYyG8Nexgi19PUGAa9iRoYSoAU1isAdfslUiX') );
app.use(parseSession({
    fetchUser: true,
    key: 'donateServSession',
    cookie: {
        maxAge: 3600000 * 24 * 30
    }
}));


//
// BASIC ROUTING
//
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://www.illuminatenations.org");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/', function(req, res) {
    res.redirect(organizationURL);
});


// 
// STATUS ROUTING
//
app.get("/status", function(req, res) {
    res.json({
        time: new Date().getTime(),
        status: "online"
    });
})
 

//
// APPLICATION ROUTING
//
app.use('/donate', require('cloud/routes/donate'));
app.use('/admin', require('cloud/routes/admin'));


//
// STARTUP
//
app.listen();