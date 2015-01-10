//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

// Localhost Testing
require("node-env-file")(__dirname + "/../.env.testing");

var should = require("should");
var stripe = require("stripe")( "sk_test_NNOEYfuSLvdLlZrd7jNFRIzg" );
var request = require("request");
var database = require("../models");

var data = require("./data.json");
var subscription = "";
data.single.donation.amount = (( Math.random() * 100 ).toFixed(2)) * 100;


describe("Starting Monthly Donations", function() {
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
});
