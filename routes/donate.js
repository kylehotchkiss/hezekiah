//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var express = require("express");
var meta = require("../package.json");
var stripe = require("../library/stripe");
var database = require('../models');
var mandrill = require("../library/mandrill");
var mailchimp = require("../library/mailchimp");

module.exports = function() {
  	var app = express();

    // Todo
    // 1) break actual stripe processing code into new function
    // 2) proper error forwarding
    // 3) return feedback (async)
    // 4) sendemail function (async)
    // 5) recordDonation (async)
    // 6) subscribeemail (async)


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
	        slug: req.body.causeSlug,
	        title: req.body.causeTitle
	    };

        // get cause from DB given slug

        stripe.process(donation, cause, function( error, charge ) {
            if ( error ) {
                res.json({
                    status: "failure",
                    timestamp: new Date().getTime(),
                    server: meta.name + " v" + meta.version,
                    error: {
                        code: error.code,
                        reason: error.type,
                        message: error.message
                    }
                })
            } else {
                //mandrill.sendEmail(donation, cause);
                //mailchimp.subscribeEmail(donation, cause);

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

                res.json({
                    status: "success",
                    timestamp: new Date().getTime(),
                    server: meta.name + " v" + meta.version,
                })
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
