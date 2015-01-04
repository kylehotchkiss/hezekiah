//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

// Localhost Testing
if ( process.env.NODE_ENV === "testing" ) {
    require("node-env-file")(__dirname + "/../.env.testing");
}

var should = require("should");
var stripe = require("stripe")( "sk_test_NNOEYfuSLvdLlZrd7jNFRIzg" );
var request = require("request");
var database = require("../library/database.js");

var amount = ( Math.random() * 100 ).toFixed(2);

var API = "http://localhost:5000";

var donation = {
    name: "Drink Mocha",
    email: "kyle@kylehotchkiss.com",
    amount: amount,
    campaign: "mocha",
    campaignName: "Mocha Testing",
    addressCity: "Lynchburg",
    addressState: "Virginia",
    addressStreet: "125 Portico St",
    addressPostal: 24502,
    addressCountry: "US",
    session: "MOCHA-TEST-SUITE"
};

var card = {
    exp_month: "06",
    exp_year: "2017",
    number: "4242 4242 4242 4242"
};

describe("Donation Processing", function() {

    it("successfully processes a donation", function( done ) {
        stripe.tokens.create({
            card: card
        }, function( error, token ) {
            donation.token = token.id;

            request({
                url: API + "/donate/one",
                method: "POST",
                form: donation,
                json: true
            }, function( error, response, body ) {

                body.status.should.equal("success");

                done();

            });
        });
    });

    
});
