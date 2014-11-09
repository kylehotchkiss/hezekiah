//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var Keen = require('keen.io');
var mandrill = require("../library/mandrill.js");
var database = require("../library/database.js");

var keen = Keen.configure({
    projectId: process.env.HEZ_KEEN_PROJECT,
    writeKey: process.env.HEZ_KEEN_WRITE
});

/*donation
    send to quickbooks
    send to slack (XX has made a $XX donation to XX)

refund
    send to db
    send email
    send to keenio (?)
    send to quickbooks (?)
    send to slack */

//
// Helper/Wrapper functions around our various interfaces
//
var save = function( donation, callback ) {
    donationData = new database.DonationModel( donation );

    donationData.save(function( error ) {
        if ( error ) {
            // Log DB Error

            console.log( error );

            if ( typeof callback === "function" ) {
                callback( error );
            }
        } else {
            if ( typeof callback === "function" ) {
                callback( false );
            }
        }
    });
};

var receipt = function( data, subject, template, callback ) {
    mandrill.send( donation.email, subject, data, template, function() {
        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

var notification = function( data, subject, template, callback ) {
    mandrill.send( "kyle@kylehotchkiss.com", subject, data, template, function() {
        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

var keenio = function( donation, callback ) {
    // Weird scope leaks keep happening here, so lock the scope of any edits
    // to the donation object.
    var thisDonation = donation;
    thisDonation.amount = parseFloat( thisDonation.amount );

    keen.addEvent( "Donations", thisDonation, function() {
        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

exports.postDonate = function( donation, callback ) {
    save( donation );
    keenio( donation );
    receipt( donation, "Thank you for your donation!", "donation-receipt" );
    notification( donation, "[donation] A donation has been processed", "donation-notification" );
    // subscription
    // quickbooks
    // slack?
};

exports.postRefund = function() {

};

exports.postSubscribe = function( subscription, callback ) {
    receipt( subscription, "You now make monthly donations!", "subscription-receipt" );
    notification( subscription, "[subscriptions] A donor has enabled automatic donations", "subscription-notification" );
};

exports.postUnsubscribe = function() {

};
