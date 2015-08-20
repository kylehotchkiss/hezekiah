//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

// Localhost Testing
if ( process.env.NODE_ENV !== "testing" ) {
    require("node-env-file")(__dirname + "/../.env.testing");
}

var should = require("should");
var request = require('supertest');
var hezekiah = require('../app.js');
var database = require("../models");
var stripe = require("stripe")( process.env.HEZ_STRIPE_API );

var data = require("./data.json");
var subscription = "";
data.monthly.donation.amount = ((( Math.random() * 100 )) * 100).toFixed(0);


describe("Monthly Subscriptions - New Donor", function() {
    it("successfully processed the subscription [api]", function( done ) {
        stripe.tokens.create({
            card: data.monthly.card
        }, function( error, token ) {
            data.monthly.donation.token = token.id;

            request( hezekiah )
                .post( "/api/donate/monthly" )
                .type( 'form' )
                .send( data.monthly.donation )
                .end(function( error, response ) {
                    var body = response.body;

                    should( body.status ).equal("success");
                    should( body.subscription ).match(/sub_(.*)$/);

                    subscription = body.subscription;

                    done();
                });
        });
    });

    it("successfully processed the subscription [stripe]", function( done ) {
        setTimeout(function() {
            database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
                should( donorObj ).be.ok;

                stripe.customers.retrieveSubscription( donorObj.customerID, subscription,
                    function( error, subscription ) {
                        should( subscription.status ).equal("active");

                        // TODO: Check transaction amount

                        done();
                    });

            });
        }, 1000);
    });

    it("successfully saved the donor [database]", function( done ) {
        setTimeout(function() {
            database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
                should( donorObj ).be.ok;
                should( donorObj.subscriber ).equal( true );

                done();
            });
        }, 1000);
    });

    it("successfully saved the first transaction [webhooks]", function( done ) {
        var counter = 0;

        var findTransaction = (function findTransaction() {
            counter++;

            database.Donation.find({ where: { subscriptionID: subscription } }).then(function( donationObj ) {
                if ( donationObj === null ) {
                    setTimeout(function() {
                        findTransaction();
                    }, 1000);
                } else {
                    // We need to round the amount the same way that the backend will - converting to a dollar
                    // amount and rounding via toFixed();
                    var roundedAmount = (Math.floor( data.monthly.donation.amount / 100 ) * 100);

                    should( donationObj ).be.ok;
                    should( donationObj.donorID ).be.ok;
                    should( donationObj.amount ).equal( roundedAmount );
                    should( donationObj.campaign ).equal( data.monthly.donation.campaign );

                    done();
                }
            });
        })();
    });

    it("successfully created a campaign record [database]");
    it("successfully created a subcampaign record [database]");
});
