//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2015 Illuminate Nations
// All Rights Reserved
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var request = require('request');
var mandrill = require("../library/mandrill.js");
var database = require("../models");
var mailchimp = require("../library/mailchimp.js");

/*donation
    send to quickbooks

refund
    send to quickbooks (?) */

//
// Helper/Wrapper functions around our various interfaces
//
var save = function( donation, callback ) {
    database.Donation.find({ where: { id: donation.id } }).then(function( donationObj ) {
        if ( donationObj === null ) {
            database.Donation.create( donation ).then(function() {
                if ( typeof callback === "function" ) {
                    callback( false );
                }
            });
        } else {
            donationObj.updateAttributes( donation ).then(function() {
                if ( typeof callback === "function" ) {
                    callback( false );
                }
            }, function( error ) {
                if ( typeof callback === "function" ) {
                    callback( error );
                }
            });
        }
    }, function( error ) {
        if ( typeof callback === "function" ) {
            callback( error );
        }
    });
};

var receipt = function( data, subject, template, callback ) {
    mandrill.send( data.email, subject, data, template, function( error, id ) {
        if ( typeof callback === "function" ) {
            if ( error ) {
                callback( error, false );
            } else {
                callback( false, id );
            }
        }
    });
};

var notification = function( data, subject, template, callback ) {
    // todo: set donation amount to dollars, not cents

    mandrill.send( "kyle@kylehotchkiss.com", subject, data, template, function( error, id ) {
        if ( typeof callback === "function" ) {
            if ( error ) {
                callback( error, false );
            } else {
                callback( false, id );
            }
        }
    });
};

var subscribe = function( donation, callback ) {
    mailchimp.subscribeEmail( donation.name, donation.email, [ donation.campaign, "donor" ], donation.ip, function() {
        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

var slack = function( message, callback ) {
    if ( process.env.HEZ_SLACK_URL ) {
        request({
            json: true,
            body: { text: message },
            url: process.env.HEZ_SLACK_URL
        });
    }
};

exports.postDonate = function( donation, callback ) {
    receipt( donation, "Thank you for your donation!", "donation-receipt", function( error, receipt ) {
        donation.receiptID = receipt;

        save( donation );
        slack("[donation] A $" + donation.amount + " donation for " + donation.description + " was successfully processed" );
        notification( donation, "[donation] A donation has been processed", "donation-notification" );
        subscribe( donation );
    });

    // quickbooks
};

exports.postRefund = function( donation, callback ) {
    donation.refunded = true;

    save( donation );
    slack("[refund] A $" + donation.amount + " donation for " + donation.description + " was successfully refunded" );
    receipt( donation, "Your donation has been refunded", "refund-receipt" );
    notification( donation, "[refund] A donation has been refunded", "refund-notification" );
};

exports.postSubscribe = function( subscription, callback ) {
    slack("[subscriptions] A $" + subscription.amount + " subscription for " + subscription.description + " was successfully started" );
    receipt( subscription, "You now make monthly donations!", "subscription-receipt" );
    notification( subscription, "[subscriptions] A donor has enabled automatic donations", "subscription-notification" );
};

exports.postUnsubscribe = function( subscription, callback ) {
    slack("[subscriptions] A $" + subscription.amount + " subscription for " + subscription.description + " was canceled" );
    receipt( subscription, "You have disabled monthly donations", "unsubscription-receipt" );
    notification( subscription, "[subscriptions] A donor has disabled automatic donations", "unsubscription-notification" );
};
