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
var mandrill = require("../library/mandrill");

var data = require("./data.json");
var qs = "?email=" + encodeURIComponent( data.monthly.donation.email ) +
    "&postal=" + data.monthly.donation.addressPostal;


describe("Cancel Subscription", function() {
    it("successfully queries the quantity of subscriptions [api]", function( done ) {
        request({
            url: process.env.HEZ_TESTING_SERVER + "/donate/retrieve" + qs,
            json: true
        }, function( error, response, body ) {
            should( body.status ).equal("success");
            should( body.total ).greaterThan( 0 );

            done();
        });
    });

    it("successfully cancels the subscriptions [api]", function( done ) {
        request({
            url: process.env.HEZ_TESTING_SERVER + "/donate/cancel" + qs,
            json: true
        }, function( error, response, body ) {
            should( body.status ).equal("success");
            should( body.total ).greaterThan( 0 );

            done();
        });
    });

    it("successfully cancels the subscriptions [stripe]", function( done ) {
        database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
            stripe.customers.listSubscriptions(donorObj.customerID, function( error, subscriptions ) {
                should( subscriptions.data.length ).equal( 0 );

                done();
            });
        });
    });

    it("successfully removes the subscriber flag from the donor [database]", function( done ) {
        database.Donor.find({ where: { email: data.monthly.donation.email }}).then(function( donorObj ) {
            should( donorObj.subscriber ).equal( false );

            done();
        });
    });

    it("successfully receives a response of 0 while querying quantity of subscriptions [api]", function( done ) {
        request({
            url: process.env.HEZ_TESTING_SERVER + "/donate/retrieve" + qs,
            json: true
        }, function( error, response, body ) {
            should( body.status ).equal("success");
            should( body.total ).equal( 0 );

            done();
        });
    })
});
