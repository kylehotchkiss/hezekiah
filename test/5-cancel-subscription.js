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
var qs = "?email=" + encodeURIComponent( data.monthly.donation.email ) +
    "&postal=" + data.monthly.donation.addressPostal;


describe("Cancel Subscription", function() {
    it("successfully queries the quantity of subscriptions [api]", function( done ) {
        request( hezekiah )
            .get( "/api/donate/retrieve" + qs )
            .end(function( error, response ) {
                var body = response.body;
                should( body.status ).equal("success");
                should( body.total ).greaterThan( 0 );

                done();
            });
    });

    it("successfully cancels the subscriptions [api]", function( done ) {
        request( hezekiah )
            .get( "/api/donate/cancel" + qs )
            .end(function( error, response ) {
                var body = response.body;
                should( body.status ).equal("success");
                should( body.total ).greaterThan( 0 );

                done();
            });
    });

    it("successfully cancels the subscriptions [stripe]", function( done ) {
        setTimeout(function() {
            database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
                stripe.customers.listSubscriptions(donorObj.customerID, function( error, subscriptions ) {
                    should( subscriptions.data.length ).equal( 0 );

                    done();
                });
            });
        }, 1000);
    });

    it("successfully updated the donor [database]", function( done ) {
        setTimeout(function() {
            database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
                should( donorObj.subscriber ).equal( false );

                done();
            });
        }, 1000);
    });

    it("successfully updated the subscription [database]", function( done ) {
        setTimeout(function() {
            database.Recurring.findAll().then(function( recurringObj ) {
                // Only one of our donations is cancelled due to the returned query string
                should( recurringObj[1] ).be.ok;
                should( recurringObj[1].active ).equal( false );

                done();
            });
        }, 5000);
    });

    it("successfully receives a response of 0 while querying quantity of subscriptions [api]", function( done ) {
        request( hezekiah )
            .get( "/api/donate/retrieve" + qs )
            .end(function( error, response ) {
                var body = response.body;

                should( body.status ).equal("success");
                should( body.total ).equal( 0 );

                done();
            });
    });
});
