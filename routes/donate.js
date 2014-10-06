//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var database = require("../library/database.js");
var stripe = require("../library/stripe.js");

exports.one = function( req, res ) {
    /*var donation = new database.DonationModel({
        ip: "10.10.10.10",
        amount: 10,
        campaign: "Just Testing",
        donorName: "Kyle Hotchkiss",
        donorEmail: "kyle@kylehotchkiss.com",
        donorPostal: 24502,
        stripeID: "ch_14je7Y2Wcx4zZRbWQO6Tm515",
        customerID: "cus_4uAi3jsAPFp7Yv"
    });

    donation.save(function( error ) {
        if ( error ) {
            console.log( error )
        } else {
            console.log( "done" )
        }
    })*/

    stripe.process({
        ip: "127.0.0.1",
        name: "Kyle Hotchkiss",
        email: "kyle@kylehotchkiss.com",
        amount: 10,
        campaignName: "Test",
        campaignSlug: "test"
    }, function( error, charge ) {
        console.log("done");
    })
}

exports.retrieve = function( req, res ) {

}

exports.recurring = function( req, res ) {

}

exports.cancel = function( req, res ) {

}
