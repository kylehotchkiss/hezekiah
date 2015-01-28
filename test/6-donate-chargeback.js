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
var stripe = require("stripe")( "sk_test_NNOEYfuSLvdLlZrd7jNFRIzg" );
var request = require("request");
var database = require("../models");
var mandrill = require("../library/mandrill");

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

            request({
                url: process.env.HEZ_TESTING_SERVER + "/donate/one",
                method: "POST",
                form: data.stolen.donation,
                json: true
            }, function( error, response, body ) {

                should( body.status ).equal("success");
                should( body.transaction ).match(/ch_(.*)$/);

                transaction = body.transaction;

                var updateDispute = (function updateDispute() {
                    stripe.charges.updateDispute(transaction, {
                        evidence: "losing_evidence"
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
