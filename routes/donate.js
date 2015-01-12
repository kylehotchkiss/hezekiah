//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var api = require("../library/api.js");
var hooks = require("../library/hooks.js");
var stripe = require("../library/stripe.js");
var database = require("../models");



exports.one = function( req, res ) {
    req.checkBody("token").notEmpty().len(28);
    req.checkBody("name").notEmpty();
    req.checkBody("email").notEmpty().isEmail();
    req.checkBody("amount").notEmpty().isInt();
    req.checkBody("campaign").notEmpty();
    req.checkBody("description").notEmpty();
    req.checkBody("addressCity").notEmpty();
    req.checkBody("addressState").notEmpty();
    req.checkBody("addressPostal").notEmpty();
    req.checkBody("addressStreet").notEmpty();
    req.checkBody("addressCountry").notEmpty();

    var donation = {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        date: Date.now(),
        source: "stripe",
        token: req.body.token,
        name: req.body.name,
        email: req.body.email,
        amount: req.body.amount, // Amounts are handled by their value in cents
        campaign: req.body.campaign,
        description: req.body.description,
        addressCity: req.body.addressCity,
        addressState: req.body.addressState,
        addressPostal: req.body.addressPostal,
        addressStreet: req.body.addressStreet,
        addressCountry: req.body.addressCountry
    };

    var errors = req.validationErrors();

    if ( errors ) {
        api.error( req, res, "validation", "Please correct the following fields", req.validationErrors(true) );
    } else {
        stripe.single(donation, function( error, charge ) {
            if ( error ) {
                api.error( req, res, error.code, error.message );
            } else {
                res.json({ status: "success", transaction: charge.id });

                donation.transactionID = charge.id;
                donation.customerID = charge.customer;

                hooks.postDonate( donation );
            }
        });
    }
};

exports.monthly = function( req, res ) {
    req.checkBody("token").notEmpty().len(28);
    req.checkBody("name").notEmpty();
    req.checkBody("email").notEmpty().isEmail();
    req.checkBody("amount").notEmpty().isInt();
    req.checkBody("campaign").notEmpty();
    req.checkBody("description").notEmpty();
    req.checkBody("addressCity").notEmpty();
    req.checkBody("addressState").notEmpty();
    req.checkBody("addressPostal").notEmpty();
    req.checkBody("addressStreet").notEmpty();
    req.checkBody("addressCountry").notEmpty();

    var donation = {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        source: "stripe",
        recurring: true,
        date: Date.now(),
        token: req.body.token,
        name: req.body.name,
        email: req.body.email,
        amount: req.body.amount, // Amounts are handled by their value in cents
        campaign: req.body.campaign,
        description: req.body.description,
        addressCity: req.body.addressCity,
        addressState: req.body.addressState,
        addressPostal: req.body.addressPostal,
        addressStreet: req.body.addressStreet,
        addressCountry: req.body.addressCountry
    };

    var errors = req.validationErrors();

    if ( errors ) {
        api.error( req, res, "validation", "Please correct the following fields", req.validationErrors(true) );
    } else {
        stripe.monthly(donation, function( error, subscription ) {
            if ( error ) {
                api.error( req, res, error.code, error.message );
            } else {
                res.json({ status: "success", subscription: subscription.id });
            }
        });
    }
};

exports.retrieve = function( req, res ) {
    var email = req.param("email");
    var postal = req.param("postal");

    if ( email && postal ) { // TODO FILTER
        stripe.retrieve(email, postal, function( error, total ) {
            if ( error ) {
                api.error( req, res, error );
            } else {
                res.json({ status: "success", total: total });
            }
        });
    } else {
        api.error( req, res, "validation", "You must provide your email and postal code" );
    }
};

exports.cancel = function( req, res ) {
    var email = req.param("email");
    var postal = req.param("postal");

    if ( email && postal ) {
        stripe.cancel(email, postal, function( error, total ) {
            if ( error ) {
                res.json({ status: "error", error: error });
            } else {
                res.json({ status: "success", total: total });
            }
        });
    } else {
        api.error( req, res, "validation", "You must provide your email and postal code" );
    }
};
