//
// Illuminate Nations - DonateServ v.1
// Copyright 2013 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

module.exports = function() {
	var express = require('express');
  	var app = express();

  	app.post('/one', function(req, res) {
	    var donation = {
	        ip: req.body.donationIP,
	        name: req.body.donorName,
	        email: req.body.donorEmail,
	        token: req.body.donationToken,
	        thanks: req.body.donationThanks,
	        amount: req.body.donationAmount,
	        emailSignup: req.body.emailSignup,
	        mailchimpID: req.body.mailchimpID
	    };

	    var cause = {
	        slug: req.body.causeSlug,
	        title: req.body.causeTitle
	    };

	    helpers.processDonation( donation, cause, function( error, response ) {
	        if ( !error ) {
	            helpers.sendEmail( donation, cause, function() {
	                helpers.subscribeEmail( donation, function() {
	                    helpers.recordDonation( donation, cause, function( error, response ) {
	                        res.json({
	                            status: "success",
	                            timestamp: new Date().getTime(),
	                            server: programName + " " + programVersion
	                        })
	                    });
	                });    
	            });
	        } else {
	            var errorReason, errorMessage;

	            if ( response.name === "card_error" ) {
	                errorReason = "rejection";
	                errorMessage = "Your card was declined. <br /> Please call your bank for more details."
	            } else if ( response.name === "api_error" ) {
	                errorReason = "outage";
	                errorMessage = "Your donation could not be processed at this time. <br /> Please try again later."
	            }

	            res.json({
	                status: "failure",
	                timestamp: new Date().getTime(),
	                server: programName + " " + programVersion,
	                error: {
	                    reason: errorReason,
	                    message: errorMessage
	                }
	            })
	        }
	    })
	});

	app.post('/subscribe', function(req, res) {
	});

	app.post('/unsubscribe', function(req, res) {
	});

	return app;
}();