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
var database = require("../models");
var hezekiah = require('../app.js');
var mandrill = require("../library/mandrill");
var stripe = require("stripe")( process.env.HEZ_STRIPE_API );

var data = require("./data.json");
var receiptID = "";
var transaction = "";
data.single.donation.amount = ((( Math.random() * 100 )) * 100).toFixed(0);


describe("Single Donation", function() {
    it("successfully processed the donation [api]", function( done ) {
        stripe.tokens.create({
            card: data.single.card
        }, function( error, token ) {
            data.single.donation.token = token.id;

            request( hezekiah )
                .post( "/donate/one" )
                .type( 'form' )
                .send( data.single.donation )
                .end(function( error, response ) {
                    var body = response.body;

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

            // TODO: Check transaction amount

            done();
        });
    });

    it("successfully saved the donation [database]", function( done ) {
        setTimeout(function() {
            database.Donation.find({ where: { transactionID: transaction }}).then(function( donationObj ) {
                should( donationObj ).be.ok;
                should( donationObj.donorID ).be.ok;
                should( donationObj.transactionID ).be.ok;

                receiptID = donationObj.receiptID;

                done();
            });
        }, 1000);
    });
});
