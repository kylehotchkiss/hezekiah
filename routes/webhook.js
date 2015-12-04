//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

var hooks = require("../library/hooks.js");
var stripe = require("stripe")( process.env.HEZ_STRIPE_API );
var database = require("../models");

exports.dispatcher = function( req, res ) {
    var customer, subscription;

    var stripeEvent = req.body;
    var transaction = stripeEvent.data.object;


    if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.closed" ) {
        //
        // Refund or dispute successfully processed
        //

        if ( stripeEvent.type === "charge.refunded" ) {
            hooks.postRefund( transaction.id );
        } else {
            hooks.postRefund( transaction.charge );
        }

    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
        //
        // Recurring Donations successfully made
        //

        customer = transaction.customer;
        subscription = transaction.subscription;

        database.Recurring.find({ where: { stripeID: subscription } }).then(function( recurringObj ) {
            if ( recurringObj !== null ) {
                recurringObj.getDonor().then(function( donorObj ) {
                    var donation = recurringObj.toJSON();
                    donation.donor = donorObj.toJSON();

                    donation.recurring = true;
                    donation.source = 'stripe';
                    donation.subscriptionID = subscription;
                    donation.transactionID = transaction.charge;
                    donation.amount = transaction.amount_due.toFixed(0);

                    // Filter out some excessive data so postgres doesn't choke later
                    delete donation.id;

                    hooks.postDonate( donation );
                });
            } else {
                console.log('Warning! Subscription ID `' + subscription + '` does not exist!');
            }
        });
    } else if ( stripeEvent.type === "customer.subscription.created" ) {
        //
        // Monthly donations successfully begun
        //

        database.Recurring.find({
            where: { stripeID: transaction.id },
        }).then(function( recurringObj ) {
            if ( recurringObj !== null ) {
                recurringObj.getDonor().then(function( donorObj ) {
                    var donation = recurringObj.toJSON();
                    donation.donor = donorObj.toJSON();

                    hooks.postSubscribe( donation );
                });
            }
        });
    } else if ( stripeEvent.type === "customer.subscription.deleted" ) {
        //
        // Monthly donations successfully ended
        //

        database.Recurring.find({
            where: { stripeID: transaction.id },
        }).then(function( recurringObj ) {
            if ( recurringObj !== null ) {
                recurringObj.getDonor().then(function( donorObj ) {
                    var donation = recurringObj.toJSON();
                    donation.donor = donorObj.toJSON();

                    hooks.postUnsubscribe( donation );
                });
            }
        });
    }

    // plan changed, deleted,
    // customer deleted
    // throw Blunder issues

    res.send(200);
};

exports.backup = function( req, res ) {

};
