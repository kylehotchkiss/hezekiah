//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//
// TODO: Rename all causes to campaign
//

var express = require("express");
//var meta = require("../package.json");
var stripe = require("../library/stripe");
var database = require('../models');
var helpers = require('../library/helpers')
var mandrill = require("../library/mandrill");
var mailchimp = require("../library/mailchimp");

module.exports = function() {
    var app = express();

    // Todo
    // 1) break actual stripe processing code into new function //
    // 2) proper error forwarding //
    // 3) return feedback (async) //
    // 4) sendemail function (async) //
    // 5) recordDonation (async) //
    // 6) subscribeemail (async) //


    app.post('/one', function( req, res ) {
        var donation = {
            ip: req.connection.remoteAddress, // req/valid
            name: req.body.donorName, // req
            email: req.body.donorEmail, // req/valid
            token: req.body.donationToken, // req/valid
            //source:
            thanks: req.body.donationThanks, // req
            amount: req.body.donationAmount, // req
            emailSignup: req.body.emailSignup
        };

        var cause = {
            slug: req.body.causeSlug
        };

        database.Campaign.find({ where: { slug: cause.slug } }).error(function( error ) {
            var error = {
                reason: "dberror",
                message: "There was an internal server error. Your card was not charged."
            }


        }).success(function( causeObj ) {
            if ( causeObj === null ) {
                var error = {
                    reason: "nxcampaign",
                    message: "The campaign you have tried to donate to does not exist. Your card was not charged."
                }

                helpers.json("failure", null, error, res);
            } else {
                var cause = causeObj.dataValues;

                stripe.process(donation, cause, function( error, charge ) {
                    if ( error ) {
                        var error = {
                            code: error.code,
                            reason: error.type,
                            message: error.message
                        }

                        helpers.json("failure", null, error, res);
                    } else {
                        if ( cause.emailSignup ) {
                            mailchimp.subscribeEmail(donation, cause);
                        }

                        database.Donation.create({
                            stripeID: charge.id,
                            amount: donation.amount,
                            campaign: cause.slug,
                            subcampaign: donation.subcampaign || null,
                            donorName: donation.name,
                            donorEmail: donation.email,
                            donorIP: donation.ip,
                            method: "website",
                            recurring: false,
                            source: donation.source
                        });

                        helpers.json("success", null, null, res);

                        mandrill.sendEmail(donation, cause, "one");
                    }
                });
            }
        });
    });

    app.post('/record', function(req, res) {
        // used by stripe webhooks to tell us when to log recurring
    });

    app.post('/subscribe', function(req, res) {

    });

    app.post('/unsubscribe', function(req, res) {

    });

    return app;
}();
