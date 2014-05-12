//
// Illuminate Nations - DonateServ v0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var express = require("express");
var stripe = require("../library/stripe");
var database = require('../models');
var helpers = require('../library/helpers')
var mandrill = require("../library/mandrill");
var mailchimp = require("../library/mailchimp");

module.exports = function() {
    var app = express();

    app.post('/one', function( req, res ) {
        var allclear = true;
        var required = function() { allclear = false; return false; }

        // Create donation object
        var donation = {
            ip: req.get("X-Forwarded-For") || req.ip, // heroku
            time: new Date().getTime(),
            name: req.body.donorName || required(),
            email: req.body.donorEmail || required(), // valid
            token: req.body.donationToken || required(), // valid
            amount: req.body.donationAmount || req.body.customDonationAmount || required(), // req
            emailSignup: req.body.emailSignup
            //source: // unused for now
        };

        var campaign = {
            slug: req.body.campaignSlug || required()
        };

        // Only proceed if all fields are valid
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

                    // Process the donation via stripe
                    stripe.process(donation, campaign, function( error, charge ) {
                        if ( error ) {
                            var error = {
                                code: error.code,
                                reason: error.type,
                                message: error.message
                            }

                            helpers.json("failure", null, error, res);
                        } else {
                            // Only save to DB if donation is real.

                            if ( charge.livemode ) {
                                // Sign user up for emails if they want
                                if ( campaign.emailSignup ) {
                                    mailchimp.subscribeEmail(donation, campaign);
                                }

                                // Save donation to DB since Stripe accepted it.
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
                            }

                            // Continue the donation success for the user
                            helpers.json("success", null, null, res);

                            // Send the user an email
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
