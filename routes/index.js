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

    /*
    app.get('/admin') // Login - Dashboard
    app.post('/admin/login') // - Login Action
    app.get('/admin/logout') // - Logout Action
    app.post('/admin/user') // - New User
    app.post('/admin/user/:user') // - Update User
    app.post('/admin/account') // - Update account settings
    app.post('/admin/integrations') // - Update account Integrations
    app.get('/admin/campaigns') // View all campaigns
    app.post('/admin/campaigns') // Make new campaign
    app.get('/admin/campaigns/:campaign') // View Campaign
    app.post('/admin/campaigns/:campaign') // Edit Campaign
    app.get('/admin/campaigns/:campaign/subcampaigns') // View subcampaigns
    app.post('/admin/campaigns/:campaign/subcampaigns') // Make new subcampaign
    app.get('/admin/campaigns/:campaign/subcampaigns/:subcampaign') // View subcampaign
    app.post('/admin/campaigns/:campaign/subcampaigns/:subcampaign') // Edit subcampaign

    USER LEVELS
        Account Admin (change account settings)
        Campaigns Manager (change campaigns and associated settings)
        Reporting (view reports)
    */


    // Reporting
    app.get('/admin/reporting/latest', reporting.latest);
    app.get('/admin/reporting/monthly', reporting.monthly);
    app.get('/admin/reporting/annual', reporting.annual);
    app.get('/admin/reporting/donors', reporting.donors);
    app.get('/admin/reporting/campaigns', reporting.campaigns);


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
