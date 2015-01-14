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

var transaction = "";

describe("Single Refund", function() {
    it("successfully processed the refund [stripe]", function( done ) {
        // We're running in a sterilized test environment, so we can assume
        // that ID 0 is our first single donation from earlier. We don't want
        // to query it and risk tainted data later on.

        database.Donation.find({ where: { id: 1 } }).then(function( donationObj ) {
            should( donationObj ).be.ok;

            transaction = donationObj.transactionID;

            stripe.charges.createRefund( transaction, {}, function( error, refund ) {
                should( error ).not.be.ok;

                done();
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
                    should( donationObj.refunded ).equal(true);

                    done();
                }
            });
        })();
    });
});
