//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

var environment = process.env.NODE_ENV || 'development';

var meta = require('../package.json');

var swig = require('swig');
var moment = require("moment");
var hook = require("./hook.js");
var express = require('express');
var donate = require("./donate.js");
var reporting = require("./reporting.js");

module.exports = function( app ) {

    swig.setFilter("date", function( input ) {
        return moment( input ).format("MM.D.YYYY");
    });

    swig.setFilter("time", function( input ) {
        return moment( input ).format("h:mma");
    });

    swig.setFilter("amount", function( input ) {
        var actual = (parseInt( input ) / 100).toFixed(2);
        return "$" + actual.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    });

    // Templating
    app.engine('html', swig.renderFile);

    app.set('view engine', 'html');
    app.set('views', __dirname + '/../views');

    if ( environment !== "production" ) {
        app.set('view cache', false);
        swig.setDefaults({ cache: false, locals: { "environment": "development" } });
    }

    app.get('/', function( req, res ) {
        res.redirect('http://www.hezekiahapp.com/?referrer=' + req.subdomain);
    });

    // Hooks
    app.post('/hook/stripe', hook.dispatcher);
    app.get('/hook/backup', hook.backup);


    // API: Donation Processing 
    app.get('/api/donate/retrieve', donate.retrieve);
    app.post('/api/donate/one', donate.one);
    app.post('/api/donate/monthly', donate.monthly);
    app.get('/api/donate/cancel', donate.cancel);


    // Reporting
    app.get('/reporting/latest', reporting.latest);
    app.get('/reporting/monthly', reporting.monthly);
    app.get('/reporting/annual', reporting.annual);
    app.get('/reporting/donors', reporting.donors);
    app.get('/reporting/campaigns', reporting.campaigns);


    // 404
    app.get("*", function( req, res ) {
        res.json(404, {
            status: "error",
            message: "Not Found",
            timestamp: new Date().getTime(),
            server: meta.name + " v" + meta.version,
        });
    });

    return app;
};
