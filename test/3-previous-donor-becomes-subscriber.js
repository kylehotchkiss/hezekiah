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
var stripe = require("stripe")( "sk_test_NNOEYfuSLvdLlZrd7jNFRIzg" );
var request = require("request");
var database = require("../models");

var data = require("./data.json");
var subscription = "";
data.single.donation.amount =  ((( Math.random() * 100 )) * 100).toFixed(0);


describe("Monthly Subscriptions - Previous Donor", function() {
    it("successfully processed the subscription [api]", function( done ) {
        stripe.tokens.create({
            card: data.single.card
        }, function( error, token ) {
            data.single.donation.token = token.id;

            request({
                url: process.env.HEZ_TESTING_SERVER + "/donate/monthly",
                method: "POST",
                form: data.single.donation,
                json: true
            }, function( error, response, body ) {

                should( body.status ).equal("success");
                should( body.subscription ).match(/sub_(.*)$/);

                subscription = body.subscription;

                done();

            });
        });
    });

    it("successfully processed the subscription [stripe]", function( done ) {
        database.Donor.find({ where: { email: data.single.donation.email }}).then(function( donorObj ) {
            should( donorObj ).be.ok;

            stripe.customers.retrieveSubscription( donorObj.customerID, subscription,
                function( error, subscription ) {
                    should( subscription.status ).equal("active");

                    done();
                });
        });
    });

    it("successfully saved the donor [database]", function( done ) {
        database.Donor.find({ where: { email: data.single.donation.email }}).then(function( donorObj ) {
            should( donorObj ).be.ok;
            should( donorObj.subscriber ).equal( true );

            done();
        });
    });

    it("successfully appended the customer ID to the existing donor [database]", function( done ) {
        database.Donor.find({ where: { email: data.single.donation.email }}).then(function( donorObj ) {
            should( donorObj.customerID ).be.ok;

            done();
        });
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
                    should( donationObj.donorID ).be.ok;
                    should( donationObj.amount ).equal( roundedAmount );
                    should( donationObj.campaign ).equal( data.single.donation.campaign );

                    done();
                }
            });
        })();
    });
});
