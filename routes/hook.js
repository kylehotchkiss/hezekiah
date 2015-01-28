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

		var id;

		if ( stripeEvent.type === "charge.refunded" ){
			id = transaction.id;
		} else {
			id = transaction.charge;
		}

		database.Donation.find({ where: { "transactionID": id } }).then(function( donationObj ) {
			if ( donationObj !== null ) {
				hooks.postRefund( donationObj.toJSON() );
			}
		});
    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
		//
		// Recurring Donations successfully made
		//

		customer = transaction.customer;
		subscription = transaction.subscription;

		database.Donor.find({ where: { "customerID": customer } }).then(function( donorObj ) {
			if ( donorObj !== null ) {
				var donation = {
					recurring: true,
					source: "stripe",
					donorID: donorObj.id,
					email: donorObj.email,
					date: transaction.date * 1000,
					transactionID: transaction.charge,
					amount: transaction.amount_due.toFixed(0),
					subscriptionID: transaction.lines.data[0].id
				};

				stripe.customers.retrieveSubscription( customer, subscription, function( error, subscription ) {
					donation.ip = subscription.metadata.ip;
					donation.campaign = subscription.metadata.campaign;
					donation.description = subscription.metadata.description;

					hooks.postDonate( donation );
				});
			}
		});


    } else if ( stripeEvent.type === "customer.subscription.created" ) {
		//
		// Monthly donations successfully begun
		//

		hooks.postSubscribe({
			name: transaction.metadata.name,
			date: transaction.start * 1000,
			email: transaction.metadata.email,
			amount: transaction.quantity, // Stripe tracks quantity for plans
			description: transaction.metadata.description
		});
	} else if ( stripeEvent.type === "customer.subscription.deleted" ) {
		//
		// Monthly donations successfully ended
		//

		hooks.postUnsubscribe({
			name: transaction.metadata.name,
			date: transaction.canceled_at * 1000,
			email: transaction.metadata.email,
			amount: transaction.quantity, // Stripe tracks quantity for plans
			description: transaction.metadata.description
		});
    }

	// plan changed, deleted,
	// customer deleted
	// throw Blunder issues

	res.send(200);
};

exports.backup = function( req, res ) {

};
