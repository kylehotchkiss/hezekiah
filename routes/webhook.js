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

        database.Recurring.find({
            where: { stripeID: subscription },
            include: [{ model: database.Donor }]
        }).then(function( recurringObj ) {
            if ( recurringObj !== null ) {
                var donation = recurringObj.toJSON();

                donation.recurring = true;
                donation.source = 'stripe';
                donation.name = donation.Donor.name;
                donation.transactionID = transaction.charge;
                donation.subscriptionID = subscription;
                donation.date = transaction.date * 1000;
                donation.amount = transaction.amount_due.toFixed(0);

                // Filter out some excessive data so postgres doesn't choke later
                delete donation.id;
                delete donation.Donor;

                hooks.postDonate( donation );
            } else {
                console.log('Warning! Subscription ID `' + subscription + '` does not exist!');
            }
        });
    } else if ( stripeEvent.type === "customer.subscription.created" ) {
        //
        // Monthly donations successfully begun
        //

        database.Recurring.find({
            where: { "stripeID": transaction.id },
            include: [{ model: database.Donor }]
        }).then(function( recurringObj ) {
            if ( recurringObj !== null ) {
                hooks.postSubscribe({
                    name: recurringObj.Donor.name,
                    date: transaction.start * 1000,
                    email: transaction.metadata.email,
                    amount: transaction.quantity, // Stripe tracks quantity for plans
                    description: transaction.metadata.description
                });
            }
        });
    } else if ( stripeEvent.type === "customer.subscription.deleted" ) {
        //
        // Monthly donations successfully ended
        //

        customer = transaction.customer;

        database.Donor.find({ where: { "customerID": customer } }).then(function( donorObj ) {
            if ( donorObj !== null ) {
                hooks.postUnsubscribe({
                    id: transaction.id,
                    name: donorObj.name,
                    date: transaction.canceled_at * 1000,
                    email: transaction.metadata.email,
                    amount: transaction.quantity, // Stripe tracks quantity for plans
                    description: transaction.metadata.description
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
