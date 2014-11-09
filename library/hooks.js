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

var receipt = function( donation, subject, template, callback ) {
    mandrill.send( donation.email, subject, donation, template, function() {
        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

var notification = function( donation, subject, template, callback ) {
    mandrill.send( "kyle@kylehotchkiss.com", subject, donation, template, function() {
        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

var keenio = function( donation, callback ) {
    donation.amount = parseInt( donation.amount );

    keen.addEvent( "Donations", donation, function() {
        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

exports.postDonate = function( donation, callback ) {
    console.log( donation );
    
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

exports.postSubscribe = function() {

};

exports.postUnsubscribe = function() {

};
