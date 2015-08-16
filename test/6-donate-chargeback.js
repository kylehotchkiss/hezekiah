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
data.stolen.donation.amount = ((( Math.random() * 100 )) * 100).toFixed(0);

describe("Single Donation - Chargeback", function() {
    it("successfully processed the donation [api]", function( done ) {
        stripe.tokens.create({
            card: data.stolen.card
        }, function( error, token ) {
            data.stolen.donation.token = token.id;

            request( hezekiah )
                .post( "/api/donate/one" )
                .type( "form" )
                .send( data.stolen.donation )
                .end(function( error, response ) {
                    var body = response.body;

                    should( body.status ).equal("success");
                    should( body.transaction ).match(/ch_(.*)$/);

                    transaction = body.transaction;

                    var updateDispute = (function updateDispute() {
                        stripe.charges.updateDispute(transaction, {
                            evidence: {"uncategorized_text": "losing_evidence" }
                        }, function( error, dispute ) {
                            if ( error ) {
                                setTimeout(function() {
                                    updateDispute();
                                }, 5000);
                            } else {
                                done();
                            }
                        });
                    })();
                });
        });
    });

    it("successfully saved the refund [webhooks]", function( done ) {
        var counter = 0;

        var findTransaction = (function findTransaction() {
            counter++;

            database.Donation.find({ where: { transactionID: transaction } }).then(function( donationObj ) {
                if ( donationObj === null || donationObj.refunded !== true ) {
                    setTimeout(function() {
                        findTransaction();
                    }, 5000);
                } else {
                    should( donationObj ).be.ok;
                    should( donationObj.refunded ).be.ok;

                    done();
                }
            });
        })();
    });
});
