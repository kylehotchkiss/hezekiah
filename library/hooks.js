//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

var _ = require('lodash');
var request = require('request');
var mandrill = require("../library/integrations/mandrill.js");
var mailchimp = require("../library/integrations/mailchimp.js");

var donation = require('../library/components/donation.js');
var recurring = require('../library/components/recurring.js');

var receipt = function( data, subject, template, callback ) {
    function sendNormally() {
        mandrill.send( data.email, subject, data, template, false, function( error, id ) {
            if ( typeof callback === "function" ) {
                if ( error ) {
                    callback( error, false );
                } else {
                    callback( false, id );
                }
            }
        });
    }

    function sendTemplate() {
        var customTemplate = _.get(data, 'Campaign.metadata.emails.donation');

        mandrill.send( data.email, subject, data, false, customTemplate, function( error, id ) {
            if ( typeof callback === "function" ) {
                if ( error ) {
                    callback( error, false );
                } else {
                    callback( false, id );
                }
            }
        });
    }

    if ( _.get(data, 'Campaign.metadata.emails.donation') ) {
        sendTemplate();
    } else {
        sendNormally();
    }
};

var notification = function( data, subject, template, callback ) {
    mandrill.send( "accounts@illuminatenations.org", subject, data, template, false, function( error, id ) {
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

exports.postDonate = function( data, callback ) {
    donation.create( data, function( error, donationObj ) {
        donationObj.amount = donationObj.amount / 100;
        donationObj.transactionFee = donationObj.transactionFee / 100;

        slack("[donation] A $" + donationObj.amount + " donation for " + donationObj.description + " was successfully processed" );
        receipt( donationObj, "Thank you for your donation!", "donation-receipt");
        notification( donationObj, "[donation] A donation has been processed", "donation-notification" );
        subscribe( donationObj );
    });

    // quickbooks
};

exports.postRefund = function( donationID, callback ) {
    donation.refund( donationID, function( error, donationObj ) {
        donationObj.amount = donationObj.amount / 100;
        donationObj.transactionFee = donationObj.transactionFee / 100;

        slack("[refund] A $" + donationObj.amount + " donation for " + donationObj.description + " was successfully refunded" );
        receipt( donationObj, "Your donation has been refunded", "refund-receipt" );
        notification( donationObj, "[refund] A donation has been refunded", "refund-notification" );
    });
};

exports.postSubscribe = function( subscription, callback ) {
    subscription.amount = subscription.amount / 100;

    slack("[subscriptions] A $" + subscription.amount + " subscription for " + subscription.description + " was successfully started" );
    receipt( subscription, "You now make monthly donations!", "subscription-receipt" );
    notification( subscription, "[subscriptions] A donor has enabled automatic donations", "subscription-notification" );
};

exports.postUnsubscribe = function( subscription, callback ) {
    subscription.amount = subscription.amount / 100;
    
    recurring.cancelled(subscription.id, function() {
        slack("[subscriptions] A $" + subscription.amount + " subscription for " + subscription.description + " was canceled" );
        receipt( subscription, "You have disabled monthly donations", "unsubscription-receipt" );
        notification( subscription, "[subscriptions] A donor has disabled automatic donations", "unsubscription-notification" );
    });
};
