//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var database = require("../library/database.js");
var stripe = require("../library/stripe.js");

exports.one = function( req, res ) {
    var now = new Date().getTime();

    var donation = {
        ip: "10.10.10.10",
        name: "Somebody Else",
        email: "somebody@example.org",
        postal: 24502,
        amount: 13,
        campaign: "test",
        campaignName: "Test"
    };

    stripe.single(donation, function( error, charge ) {
        if ( error ) {
            console.log( error );
        } else {
            var done = new Date().getTime();
            console.log( ( done - now ) / 1000 + "s" );

            res.json({ status: "success" });

            donation.stripeID = charge.id;
            donation.customerID = charge.customer;

            donationData = new database.DonationModel( donation );

            donationData.save(function( error ) {
                if ( error ) {
                    console.log( error );
                } else {
                    console.log( "db updated" );

                    //database.DonationModel.find({ }).exec(function( error, docs ) { console.log(docs) });
                }
            });
        }
    });
};

exports.monthly = function( req, res ) {
    var donation = {
        ip: "10.10.10.10",
        name: "Monthly User",
        email: "monthly@example.org",
        postal: 24502,
        amount: 100,
        campaign: "test",
        campaignName: "Test"
    };


    stripe.monthly(donation, function( error, subscription ) {
        if ( error ) {
            console.log( error );
        } else {
            res.json({ status: "success" });

            donation.recurring = true;
            donation.stripeID = subscription.id;
            donation.customerID = subscription.customer;

            donationData = new database.DonationModel( donation );

            donationData.save(function( error ) {
                if ( error ) {
                    console.log( error );
                } else {


                    //database.DonationModel.find({ }).exec(function( error, docs ) { console.log(docs) });
                }
            });
        }
    });
};

exports.cancel = function( req, res ) {
    stripe.cancel("monthly@example.org", 24502, function( error, total ) {
        if ( error ) {

        } else {
            console.log( total );
        }
    });
};
