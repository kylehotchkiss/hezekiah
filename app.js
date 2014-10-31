//
// Illuminate Nations - DonateServ v0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var environment = process.env.NODE_ENV || 'development';

if ( environment === "production" ) {
    require('newrelic');
} else {
    require('node-env-file')(__dirname + '/.env');
}

var meta = require('./package.json');
var config = require('./config.json');

var cors = require('cors');
var express = require('express');
var compress = require('compression');
var bodyParser = require('body-parser');


//
// Express Setup
//
var app = express();
app.use(cors());
app.use(compress());
app.use(bodyParser());


//
// App Routing
//
app = require('./routes')( app );


//
// Start it UP!
//
app.listen(process.env.PORT || 5000);
console.log(meta.name + " v" + meta.version);
