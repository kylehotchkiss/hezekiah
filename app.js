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

var express = require('express');

var compress = require('compression');
var bodyParser = require('body-parser');

var meta = require('./package.json');
var config = require('./config.json');


//
// Express Setup
//
var app = express();
app.use(compress());
app.use(bodyParser());


//
// Set CORS to set access domain
//
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", config.access.domain);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    next();
});


//
// App Routing
//
app = require('./routes')( app );


//
// Start it UP!
//
app.listen(process.env.PORT || 5000);
console.log(meta.name + " v" + meta.version);
