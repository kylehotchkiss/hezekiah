//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var swig = require('swig');
var express = require('express');
var passport = require('passport');
var google = require('passport-google').Strategy;

var config = require('../config.json');
var database = require('../models');

module.exports = function() {
    var app = express();

    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/../views');

    //////////////////////////////
    // Passport Setup and Paths //
    //////////////////////////////
    passport.serializeUser(function(user, callback) {
        callback(null, user);
    });

    passport.deserializeUser(function(obj, callback) {
        callback(null, obj);
    });

    passport.use(new google({
        returnURL: 'http://localhost:5000/admin/login/callback', // Figure out how to set this properly (doh)
        realm: 'http://localhost:5000/'
    }, function( identifier, profile, done ) {
        var email = profile.emails[0].value;
        var domain = email.substring( email.search("@") + 1 );

        // Check against email domain set in config
        if ( domain === config.access.email ) {
            done(null, profile);
        } else {
            done(null, false, { message: "You must be a member of " + config.organization.name + " to access DonateServ."});
        }
    }));


    ////////////////////
    // Login / Logout //
    ////////////////////
    app.get('/', function( req, res ) {
        if ( req.user ) {
            res.send("Welcome!")
        } else {
            res.render("admin/login", { flash: req.flash('message'), user: req.user })
        }
    });

    app.get('/login', passport.authenticate('google'));

    app.get('/login/callback', passport.authenticate('google', { successRedirect: '/admin', failureRedirect: '/admin' }));

    app.get('/logout', function( req, res ) {
        req.logout();
        res.redirect('/admin');
    });


    ///////////////////////////////////////
    // Campaign Reporting and Management //
    ///////////////////////////////////////
    app.get('/campaigns', function(req, res) {
        // Campaigns Index + aggreate report

        database.Campaign.findAll().error(function( error ) {
            res.render("error", { error: error });
        }).success(function( campaigns ) {
            res.render("admin/index_campaigns", { campaigns: campaigns });
        });
    });

    app.get('/campaigns/create', function(req, res) {
        // Create Campaign VIEW

        res.render("admin/create_campaign", { user: Parse.User });
    });

    app.post('/campaigns/create', function(req, res) {
        // Create Campaign ACTION

        //req.body.
    })

    app.get('/campaigns/:campaign', function(req, res) {
        // View Campaign VIEW

        var campaign = req.param("campaign");

        database.Campaign.find({ slug: campaign }).error(function( error ) {
            res.render("error", { error: error });
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                res.render("error", { error: "Campaign not found" }); // 404
            } else {
                res.render("admin/single_campaign", { /*donations: donations,*/ campaign: campaignObj });
            }
        });
    });

    app.get('/campaigns/:campaign/edit', function(req, res) {
        // Campaign Edit VIEW

        var campaign = req.param("campaign");

        database.Campaign.find({ slug: campaign }).error(function( error ) {
            res.render("error", { error: error });
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                res.render("error", { error: "Campaign not found" }); // 404
            } else {
                res.render("admin/create_campaign", { campaign: campaignObj });
            }
        });
    });

    app.post('/campaigns/:campaign/edit', function(req, res) {
        // Edit Campaign ACTION

        var campaign = req.param("campaign");
    });

    app.get('/campaigns/:campaign/archive', function(req, res) {
        // Archive campaign ACTION
    });


    //
    // Reporting
    //
    app.get('/reports', function(req, res) {
        // Reports index VIEW
        res.render("admin/index_reports", { user: Parse.User });
    });

    app.get('/reports/search', function(req, res) {
        // Check for q string VIEW

        null;
    });


    return app;
}();
