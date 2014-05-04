//
// Illuminate Nations - DonateServ v0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var os = require("os");
var swig = require("swig");
var flash = require('connect-flash');
var express = require("express");
var passport = require("passport");
var google = require("passport-google").Strategy;
var reports = require('../library/reports');

var config = require("../config.json");
var database = require("../models");
var hostname = process.env.DS_HOSTNAME || "http://localhost:5000"
var environment = process.env.NODE_ENV || 'development';


module.exports = function() {
    var app = express();
    var realm = hostname + "/";
    var returnURL = hostname + "/admin/login/callback";

    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/../views');

    swig.setDefaults({ autoescape: false });

    // Should work, never really does though.
    app.use(flash());

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
        realm: realm,
        returnURL: returnURL
    }, function( identifier, profile, done ) {
        var email = profile.emails[0].value;
        var domain = email.substring( email.search("@") + 1 );

        // Check against email domain set in config
        if ( domain === config.access.email ) {
            done(null, profile);
        } else {
            done(null, false, { login: "You must be a member of " + config.organization.name + " to access DonateServ." });
        }
    }));


    ////////////////////
    // Login / Logout //
    ////////////////////
    app.get('/', function( req, res ) {
        if ( req.user ) {
            database.Donation.findAll().error(function( error ) {
                res.render("error", { error: error });
            }).success(function( donations ) {
                res.render("admin/index", { user: req.user, donationsString: JSON.stringify( donations ) })
            });
        } else {
            res.render("admin/login", { flash: req.flash('login'), user: req.user })
        }
    });

    app.get('/login', passport.authenticate('google'));

    app.get('/login/callback', passport.authenticate('google', { successRedirect: '/admin', failureRedirect: '/admin' }));

    app.get('/logout', function( req, res ) {
        req.logout();
        res.redirect('/admin');
    });

    var authenticate = function( req, res, next ) {
        if ( req.isAuthenticated() ) {
            return next();
        }

        res.redirect('/admin');
    }


    ///////////////////////////////////////
    // Campaign Reporting and Management //
    ///////////////////////////////////////
    app.get('/campaigns', authenticate, function(req, res) {
        // Campaigns Index + aggreate report

        database.Campaign.findAll().error(function( error ) {
            res.render("error", { error: error });
        }).success(function( campaigns ) {
            res.render("admin/index_campaigns", { campaigns: campaigns, user: req.user });
        });
    });

    app.get('/campaigns/create', authenticate, function(req, res) {
        // Create Campaign VIEW

        res.render("admin/create_campaign", { user: req.user });
    });

    app.post('/campaigns/create', authenticate, function(req, res) {
        // Create Campaign ACTION

        database.Campaign.create({
            slug: req.body.slug,
            name: req.body.name,
            goal: req.body.goal || 0,
            plan: req.body.plan,
            image: req.body.image,
            emailSubject: req.body.emailSubject,
            emailTemplate: req.body.emailTemplate
        }).error(function( error ) {
            res.render("error", { error: error });
        }).success(function() {
            res.redirect("/admin/campaigns");
        });
    })

    app.get('/campaigns/:campaign', authenticate, function(req, res) {
        // View Campaign VIEW

        var campaign = req.param("campaign");

        database.Campaign.find({ where: { slug: campaign } }).error(function( error ) {
            res.render("error", { error: error });
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                res.render('404', { user: req.user });
            } else {
                res.render("admin/single_campaign", { /*donations: donations,*/ campaign: campaignObj, user: req.user });
            }
        });
    });

    app.get('/campaigns/:campaign/edit', authenticate, function(req, res) {
        // Campaign Edit VIEW

        var campaign = req.param("campaign");

        database.Campaign.find({ where: { slug: campaign } }).error(function( error ) {
            res.render("error", { error: error });
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                res.render('404', { user: req.user });
            } else {
                res.render("admin/create_campaign", { campaign: campaignObj, user: req.user });
            }
        });
    });

    app.post('/campaigns/:campaign/edit', authenticate, function(req, res) {
        // Edit Campaign ACTION

        var campaign = req.param("campaign");

        database.Campaign.find({ where: { slug: campaign } }).error(function( error ) {
            res.render("error", { error: error });
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                res.render('404', { user: req.user });
            } else {
                database.Campaign.update({
                    slug: req.body.slug,
                    name: req.body.name,
                    goal: req.body.goal || 0,
                    plan: req.body.plan,
                    image: req.body.image,
                    emailSubject: req.body.emailSubject,
                    emailTemplate: req.body.emailTemplate
                }, { id: campaignObj.id }).error(function( error ) {
                    res.render("error", { error: error });
                }).success(function() {
                    res.redirect("/admin/campaigns/" + campaign);
                });
            }
        });
    });

    app.get('/campaigns/:campaign/archive', authenticate, function(req, res) {
        // Archive campaign ACTION
    });


    //
    // Reporting
    //
    app.get('/reports', authenticate, function(req, res) {
        // Reports index VIEW

        res.render("admin/index_reports", { reports: reports, user: req.user });
    });

    app.get('/reports/:report', authenticate, function(req, res) {
        // View Reports VIEW

        var report = req.param("report");

        if ( typeof reports[report] !== "undefined" ) {
            var thisReport = reports[report];

            thisReport.generate(function( response ) {
                if ( response.status !== "success" ) {
                    console.log( error );
                } else {
                    res.render("admin/single_report", { name: thisReport.name, data: response.data, user: req.user })
                }
            });
        } else {
            res.render('404', { user: req.user });
        }
    });

    app.get('/reports/search', authenticate, function(req, res) {
        // Check for q string VIEW

        null;
    });


    return app;
}();
