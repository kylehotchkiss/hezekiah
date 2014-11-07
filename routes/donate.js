//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var hooks = require("../library/hooks.js");
var stripe = require("../library/stripe.js");
var database = require("../library/database.js");


exports.one = function( req, res ) {
    var donation = {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        date: Date.now(),
        token: req.body.token,
        name: req.body.name,
        email: req.body.email,
        postal: req.body.postal,
        amount: req.body.amount,
        campaign: req.body.campaign,
        campaignName: req.body.campaignName
    };

    stripe.single(donation, function( error, charge ) {
        if ( error ) {
            res.json({ status: "error", error: error.code, message: error.message });
        } else {
            res.json({ status: "success" });

            donation.stripeID = charge.id;
            donation.customerID = charge.customer;

            hooks.postDonate( donation );
        }
    });
};

exports.monthly = function( req, res ) {
    var donation = {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        date: Date.now(),
        token: req.body.token,
        name: req.body.name,
        email: req.body.email,
        postal: req.body.postal,
        amount: req.body.amount,
        campaign: req.body.campaign,
        campaignName: req.body.campaignName
    };

    stripe.monthly(donation, function( error, subscription ) {
        if ( error ) {
            // TODO: this is proper error json
            res.json({ status: "error", error: error.slug, message: error.message });
        } else {
            res.json({ status: "success" });

            // TODO: our webhooks will provide a better interface to this than
            // we can right here (ie we only get subscribtion id and not the
            // transaction id) so remove this db call.

            donation.recurring = true;
            donation.stripeID = subscription.id;
            donation.customerID = subscription.customer;

            donationData = new database.DonationModel( donation );

            donationData.save(function( error ) {
                if ( error ) {
                    console.log( error );
                }
            });
        }
    });
};

exports.retrieve = function( req, res ) {
    var email = req.param("email");
    var postal = req.param("postal");

    if ( email && postal ) { // TODO FILTER
        stripe.retrieve(email, postal, function( error, total ) {
            if ( error ) {
                res.json({ status: "error", error: error });
            } else {
                res.json({ status: "success", total: total });
            }
        });
    } else {
        res.json({ status: "error", error: "validation", message: "You must provide your email and postal code" });
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
        res.json({ status: "error", error: "validation", message: "You must provide your email and postal code" });
    }
};
