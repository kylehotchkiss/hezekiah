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
var passport = require('passport');
var donate = require("./donate.js");
var reporting = require("./reporting.js");
var Local = require('passport-local').Strategy;

var admin = require('./admin.js');
var user = require('../library/components/user.js');

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

    app.use(require('connect-flash')());
    app.use(require('cookie-parser')());
    app.use(require('body-parser').urlencoded({ extended: true }));
    app.use(require('express-session')({ secret: process.env.HEZ_SECRET, cookie: { maxAge: 1440000 } }));
    app.use(passport.initialize());
    app.use(passport.session());

    if ( environment !== "production" ) {
        app.set('view cache', false);
        swig.setDefaults({ cache: false, locals: { "environment": "development" } });
    }


    // Redirect all root requests
    app.get('/', function( req, res ) {
        res.redirect('http://www.hezekiahapp.com/?referrer=' + req.subdomain);
    });

    app.get('*', function( req, res, next ) {
        if ( req.headers['x-forwarded-proto'] !== 'https' ) {
            res.redirect( request.headers.host + req.url );
        } else {
            next();
        }
    });


    // Login/Sessions
    passport.use(new Local( user.login ));
    passport.serializeUser( user.serialize );
    passport.deserializeUser( user.unserialize );


    // Hooks
    app.post('/hook/stripe', hook.dispatcher);
    app.get('/hook/backup', hook.backup);


    // API: Donation Processing
    app.get('/api/donate/retrieve', donate.retrieve);
    app.post('/api/donate/one', donate.one);
    app.post('/api/donate/monthly', donate.monthly);
    app.get('/api/donate/cancel', donate.cancel);


    /*
     // Login - Dashboard
     // - Logout Action
     // - New User
    app.post('/admin/user/:user', user.auth('admin')) // - Update User

    app.post('/admin/integrations', user.auth('admin')) // - Update account Integrations
    app.get('/admin/campaigns', user.auth('reporting')) // View all campaigns
    app.post('/admin/campaigns', user.auth('campaigns')) // Make new campaign
    app.get('/admin/campaigns/:campaign', user.auth('reporting')) // View Campaign
    app.post('/admin/campaigns/:campaign', user.auth('campaigns')) // Edit Campaign
    app.get('/admin/campaigns/:campaign/subcampaigns', user.auth('reporting')) // View subcampaigns
    app.post('/admin/campaigns/:campaign/subcampaigns', user.auth('campaigns')) // Make new subcampaign
    app.get('/admin/campaigns/:campaign/subcampaigns/:subcampaign', user.auth('reporting')) // View subcampaign
    app.post('/admin/campaigns/:campaign/subcampaigns/:subcampaign', user.auth('campaigns')) // Edit subcampaign

    USER LEVELS
        Account Admin (change account settings)
        Campaigns Manager (change campaigns and associated settings)
        Reporting (view reports)
    */


    // Admin
    app.use('/admin', admin.helpers.middleware);
    app.get('/admin', admin.views.index);
    app.post('/admin/login', passport.authenticate('local', { successRedirect: '/admin', failureRedirect: '/admin', failureFlash: true }));
    app.get('/admin/logout', admin.actions.logout);

    app.get('/admin/account', user.auth('admin'), admin.views.account); // - Update account settings
    app.post('/admin/user', user.auth('admin'), admin.actions.userCreate);


    // Reporting
    app.get('/admin/reports/latest', user.auth('reporting'), reporting.latest);
    app.get('/admin/reports/monthly', user.auth('reporting'), reporting.monthly);
    app.get('/admin/reports/annual', user.auth('reporting'), reporting.annual);
    app.get('/admin/reports/donors', user.auth('reporting'), reporting.donors);
    app.get('/admin/reports/campaigns', user.auth('reporting'), reporting.campaigns);
    app.get("/admin/*", user.auth('reporting'), admin.views.notfound);


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
