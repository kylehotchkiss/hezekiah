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

var API = "http://localhost:5000";
var data = require("./data.json");
var receiptID = "";
var transaction = "";
data.single.donation.amount = (( Math.random() * 100 ).toFixed(2)) * 100;


describe("One Time Donation", function() {
    it("successfully processed the donation [api]", function( done ) {
        stripe.tokens.create({
            card: data.single.card
        }, function( error, token ) {
            data.single.donation.token = token.id;

            request({
                url: API + "/donate/one",
                method: "POST",
                form: data.single.donation,
                json: true
            }, function( error, response, body ) {

                should( body.status ).equal("success");
                should( body.transaction ).match(/ch_(.*)$/);

                transaction = body.transaction;

                done();

            });
        });
    });

    it("successfully processed the donation [stripe]", function( done ) {
        stripe.charges.retrieve(transaction, function( error, charge ) {
            charge.should.have.property("amount");

            done();
        });
    });

    it("successfully saved the donation [database]", function( done ) {
        database.Donation.find({ where: { transactionID: transaction }}).then(function( donationObj ) {
            should( donationObj ).be.ok;

            receiptID = donationObj.receiptID;

            done();
        });
    });

});
