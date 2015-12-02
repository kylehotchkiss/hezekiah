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
data.single.donation.amount =  ((( Math.random() * 100 )) * 100).toFixed(0);


describe("Monthly Subscriptions - Previous Donor", function() {
    it("successfully processed the subscription [api]", function( done ) {
        stripe.tokens.create({
            card: data.single.card
        }, function( error, token ) {
            data.single.donation.token = token.id;

            request( hezekiah )
                .post( "/api/donate/monthly" )
                .type( 'form' )
                .send( data.single.donation )
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
            database.Donor.find({ where: { email: data.single.donation.email }}).then(function( donorObj ) {
                should( donorObj ).be.ok;

                stripe.customers.retrieveSubscription( donorObj.customerID, subscription,
                    function( error, subscription ) {
                        should( subscription.status ).equal("active");

                        done();
                    });
            });
        }, 1000);
    });

    it("successfully saved the donor [database]", function( done ) {
        setTimeout(function() {
            database.Donor.find({ where: { email: data.single.donation.email }}).then(function( donorObj ) {
                should( donorObj ).be.ok;
                should( donorObj.subscriber ).equal( true );

                done();
            });
        }, 1000);
    });

    it("successfully saved the subscription [database]", function( done ) {
        setTimeout(function() {
            database.Recurring.find({ where: { stripeID: subscription } }).then(function( recurringObj ) {
                should( recurringObj ).be.ok;
                should( recurringObj.active ).equal( true );

                done();
            });
        }, 1000);
    });

    it("successfully appended the customer ID to the existing donor [database]", function( done ) {
        setTimeout(function() {
            database.Donor.find({ where: { email: data.single.donation.email }}).then(function( donorObj ) {
                should( donorObj.customerID ).be.ok;

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
                    }, 5000);
                } else {
                    // We need to round the amount the same way that the backend will - converting to a dollar
                    // amount and rounding via toFixed();
                    var roundedAmount = (Math.floor( data.single.donation.amount / 100 ) * 100);

                    should( donationObj ).be.ok;
                    should( donationObj.email ).be.ok;
                    should( donationObj.amount ).equal( roundedAmount );
                    should( donationObj.campaign ).equal( data.single.donation.campaign );

                    done();
                }
            });
        })();
    });
});
