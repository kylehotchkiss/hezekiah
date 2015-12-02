//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

var _ = require('lodash');
var request = require('request');
var database = require("../models");
var mandrill = require("../library/integrations/mandrill.js");
var mailchimp = require("../library/integrations/mailchimp.js");

var recurring = require('../library/components/recurring.js');

/*donation
    send to quickbooks

refund
    send to quickbooks (?) */

//
// Helper/Wrapper functions around our various interfaces
// Future Kyle - I'm so sorry about this sqlize code, it's Doing Too Much™
//
var save = function( donation, callback ) {
    if ( !donation.transactionFee ) { // TODO: Stripe doesn't return fee, but it may change?
        donation.transactionFee = (( donation.amount * 0.029 ) + 30).toFixed(0);
    }

    // Prevent overwriting objects before they arrive to other hook
    var thisDonation = _.clone( donation );
    delete thisDonation.id;

    // Get donation + (sub)campaign info
    var getDonation = function( id, callback ) {
        database.Donation.find( { where: { id: id }, include: [ database.Campaign, database.Subcampaign, database.Donor ]} ).then(function( donationObj ) {
            if ( donationObj ) {
                callback( false, donationObj );
            } else {
                callback( true, false );
            }
        }, function( error ) {
            callback( error, false );
        });
    };

    // Update donation
    var updateDonation = function( donationObj, data, callback ) {
        donationObj.updateAttributes( data ).then(function( donationObj ) {
            callback( false, donationObj );
        }, function( error ) {
            callback( error, false );
        });
    };


    // Find (then update) or just create
    database.Donation.findOrCreate({ where: { id: donation.id }, defaults: thisDonation }).then(function( output ) {
        var donationObj = output[0]; // LOL WUT
        var created = output[1]; // LOL THIS IS REAL LIFE

        if ( !created && donationObj ) {
            updateDonation( donationObj, thisDonation, function( error, donationObj ) {
                getDonation( donationObj.id, function( error, donationObj ) {
                    callback( false, donationObj.toJSON() );
                });
            });
        } else {
            getDonation( donationObj.id, function( error, donationObj ) {
                callback( false, donationObj.toJSON() );
            });
        }
    }, function( error ) {
        callback( error, false );
    });
};

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

exports.postDonate = function( donation, callback ) {
    save( donation, function( error, donation ) {
        donation.amount = donation.amount / 100;

        slack("[donation] A $" + donation.amount + " donation for " + donation.description + " was successfully processed" );
        receipt( donation, "Thank you for your donation!", "donation-receipt");
        notification( donation, "[donation] A donation has been processed", "donation-notification" );
        subscribe( donation );
    });

    // quickbooks
};

exports.postRefund = function( donation, donor, callback ) {
    donation.refunded = true;

    save( donation, function( error, donation ) {
        donation.amount = donation.amount / 100;
        donation.name = donor.name;
        donation.date = donation.updatedAt;

        slack("[refund] A $" + donation.amount + " donation for " + donation.description + " was successfully refunded" );
        receipt( donation, "Your donation has been refunded", "refund-receipt" );
        notification( donation, "[refund] A donation has been refunded", "refund-notification" );
    });
};

exports.postSubscribe = function( subscription, callback ) {
    slack("[subscriptions] A $" + subscription.amount + " subscription for " + subscription.description + " was successfully started" );
    receipt( subscription, "You now make monthly donations!", "subscription-receipt" );
    notification( subscription, "[subscriptions] A donor has enabled automatic donations", "subscription-notification" );
};

exports.postUnsubscribe = function( subscription, callback ) {
    recurring.cancelled(subscription.id, function() {
        slack("[subscriptions] A $" + subscription.amount + " subscription for " + subscription.description + " was canceled" );
        receipt( subscription, "You have disabled monthly donations", "unsubscription-receipt" );
        notification( subscription, "[subscriptions] A donor has disabled automatic donations", "unsubscription-notification" );
    });
};
