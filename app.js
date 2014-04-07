//
// Illuminate Nations - DonateServ v.1
// Copyright 2013 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//
//


var express = require('express');
var consolidate = require('consolidate');
var config = require('./config.json');
//var helpers = require('./helpers.js');


//
// SETUP
//
var app = express();

app.engine( 'html', consolidate.swig );
app.set( 'view engine', 'html' );
app.set( 'views', __dirname + '/views' );
app.use( express.compress() );
app.use( express.bodyParser() ); 
app.use(express.cookieParser( process.env.DS_COOKIE_SECRET ));
app.use( express.cookieSession({
    secret: process.env.DS_COOKIE_SECRET
}) );


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
app.use('/donate', require('./routes/donate'));
app.use('/admin', require('./routes/admin'));


//
// Start it UP!
//
app.listen(process.env.PORT || 5000);