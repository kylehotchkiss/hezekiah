//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
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
data.monthly.donation.amount = ((( Math.random() * 100 )) * 100).toFixed(0);


describe("Monthly Subscriptions - New Donor", function() {
    it("successfully processed the subscription [api]", function( done ) {
        stripe.tokens.create({
            card: data.monthly.card
        }, function( error, token ) {
            data.monthly.donation.token = token.id;

            request({
                url: process.env.HEZ_TESTING_SERVER + "/donate/monthly",
                method: "POST",
                form: data.monthly.donation,
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
        database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
            should( donorObj ).be.ok;

            stripe.customers.retrieveSubscription( donorObj.customerID, subscription,
                function( error, subscription ) {
                    should( subscription.status ).equal("active");

                    // TODO: Check transaction amount

                    done();
                });

        });
    });

    it("successfully saved the donor [database]", function( done ) {
        database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
            should( donorObj ).be.ok;
            should( donorObj.subscriber ).equal( true );

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
                    var roundedAmount = (Math.floor( data.monthly.donation.amount / 100 )  * 100).toString();

                    should( donationObj ).be.ok;
                    should( donationObj.amount ).equal( roundedAmount );
                    should( donationObj.campaign ).equal( data.monthly.donation.campaign );

                    done();
                }
            });
        })();
    });
});
