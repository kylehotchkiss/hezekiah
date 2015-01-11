// dedup single donations
// dedup monthly donations
// stripe

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
var mandrill = require("../library/mandrill");

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

            request({
                url: process.env.HEZ_TESTING_SERVER + "/donate/one",
                method: "POST",
                form: data.single.donation,
                json: true
            }, function( error, response, body ) {
                should( body.status ).equal("success");

                tokenize(data.single.card, function( token ) {
                    data.single.donation.token = token;

                    request({
                        url: process.env.HEZ_TESTING_SERVER + "/donate/one",
                        method: "POST",
                        form: data.single.donation,
                        json: true
                    }, function( error, response, body ) {
                        should( body.status ).equal("error");

                        done();
                    });
                });
            });
        });
    });
});
