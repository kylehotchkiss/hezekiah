//
// Illuminate Nations - DonateServ v0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var environment = process.env.NODE_ENV || 'development';

if ( environment === "production" ) {
    require('newrelic');
} else if ( environment === "testing" ) {
    require('node-env-file')(__dirname + '/.env.testing');
} else if ( environment === "development" ) {
    require('node-env-file')(__dirname + '/.env');
}

var meta = require('./package.json');
var config = require('./config.json');

var cors = require('cors');
var raven = require('raven');
var express = require('express');
var compress = require('compression');
var bodyParser = require('body-parser');
var validator = require('express-validator');


//
// Express Setup
//
var app = express();

if ( process.env.HEZ_SENTRY_URL ) {
    app.use(raven.middleware.express(  process.env.HEZ_SENTRY_URL ));
}

if ( environment === "production" ) {
    app.use(cors({
        origin: "https://www.illuminatenations.org"
    }));
} else if ( environment === "staging" ) {
    app.use(cors({
        origin: "http://illuminatenations.dev"
    }));
} else {
    app.use(cors());
}

app.use(compress());
app.use(bodyParser());
app.use(validator());


//
// App Routing
//
app = require('./routes')( app );


//
// Start it UP!
//
app.listen( process.env.PORT || 5000 );

if ( environment === "development" ) {
    console.log( "\n " + meta.name + " v" + meta.version);
    console.log( " binded: http://0.0.0.0:" + ( process.env.PORT || 5000 ) + "/\n");
}
