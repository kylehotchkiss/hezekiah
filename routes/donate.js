//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
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
        var allclear = true;
        var required = function() { allclear = false; return false; }

        var donation = {
            ip: req.connection.remoteAddress,
            name: req.body.donorName || required(), // req
            email: req.body.donorEmail || required(), // req/valid
            token: req.body.donationToken || required(), // req/valid
            amount: req.body.donationAmount || req.body.customDonationAmount || required(), // req
            emailSignup: req.body.emailSignup
            //source:
        };

        var campaign = {
            slug: req.body.campaignSlug || required()
        };

        if ( allclear ) {
            database.Campaign.find({ where: { slug: campaign.slug } }).error(function( error ) {
                var error = {
                    reason: "dberror",
                    message: "There was an internal server error.<br />Your card was not charged."
                }

                helpers.json("failure", null, error, res);
            }).success(function( campaignObj ) {
                if ( campaignObj === null ) {
                    var error = {
                        reason: "nxcampaign",
                        message: "The campaign you have tried to donate to does not exist.<br />Your card was not charged."
                    }

                    helpers.json("failure", null, error, res);
                } else {
                    var campaign = campaignObj.dataValues;

                    stripe.process(donation, campaign, function( error, charge ) {
                        if ( error ) {
                            var error = {
                                code: error.code,
                                reason: error.type,
                                message: error.message
                            }

                            helpers.json("failure", null, error, res);
                        } else {
                            if ( campaign.emailSignup ) {
                                mailchimp.subscribeEmail(donation, campaign);
                            }

                            database.Donation.create({
                                stripeID: charge.id,
                                amount: donation.amount,
                                campaign: campaign.slug,
                                subcampaign: donation.subcampaign || null,
                                donorName: donation.name,
                                donorEmail: donation.email,
                                donorIP: donation.ip,
                                method: "website",
                                recurring: false,
                                source: donation.source
                            });

                            helpers.json("success", null, null, res);

                            mandrill.sendEmail(donation, campaign, "one");
                        }
                    });
                }
            });
        } else {
            var error = {
                reason: "validation",
                message: "You have ommited a required field.<br />Your card was not charged."
            }

            helpers.json("failure", null, error, res);
        }
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
