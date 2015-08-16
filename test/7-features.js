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
var receiptID = "";
var transaction = "";

data.single.donation.amount = ((( Math.random() * 100 )) * 100).toFixed(0);
data.monthly.donation.amount = ((( Math.random() * 100 )) * 100).toFixed(0);

var tokenize = function( card, callback ) {
    stripe.tokens.create({
        card: data.single.card
    }, function( error, token ) {
        callback( token.id );
    });
};

describe("Special Features", function() {
    it("successfully rejects a duplicate donation [api]", function( done ) {
        data.single.donation.campaign = "duplicate";

        tokenize(data.single.card, function( token ) {
            data.single.donation.token = token;

            request( hezekiah )
                .post( "/api/donate/one" )
                .type( "form" )
                .send( data.single.donation )
                .end(function( error, response ) {
                    var body = response.body;

                    should( body.status ).equal("success");

                    tokenize(data.single.card, function( token ) {
                        data.single.donation.token = token;

                        request( hezekiah )
                            .post( "/api/donate/one" )
                            .type( "form" )
                            .send( data.single.donation )
                            .end(function( error, response ) {
                                var body = response.body;
                                should( body.status ).equal("error");

                                done();
                            });
                    });
            });
        });
    });

    it("successfully rejects a duplicate subscription [api]", function( done ) {
        data.monthly.donation.campaign = "duplicate";

        tokenize(data.single.card, function( token ) {
            data.monthly.donation.token = token;

            request( hezekiah )
                .post( "/api/donate/monthly" )
                .type( "form" )
                .send( data.monthly.donation )
                .end(function( error, response ) {
                    var body = response.body;

                    should( body.status ).equal("success");

                    tokenize(data.single.card, function( token ) {
                        data.monthly.donation.token = token;

                        request( hezekiah )
                            .post( "/api/donate/monthly" )
                            .type( "form" )
                            .send( data.monthly.donation )
                            .end(function( error, response ) {
                                var body = response.body;

                                should( body.status ).equal("error");

                                done();
                            });
                    });
            });
        });
    });
});
