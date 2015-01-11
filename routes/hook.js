//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var hooks = require("../library/hooks.js");
var stripe = require("stripe")( process.env.HEZ_STRIPE_API );
var database = require("../models");

exports.dispatcher = function( req, res ) {
	var customer, subscription;

	var stripeEvent = req.body;
	var transaction = stripeEvent.data.object;

	if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.funds_withdrawn" ) {
		//
		// Refund or dispute successfully processed
		//

		database.Donation.find({ where: { "transactionID": transaction.id } }).then(function( donationObj ) {
			if ( donationObj !== null ) {
				hooks.postRefund( donationObj );
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
					donor: donorObj[0]._id,
					email: donorObj[0].email,
					date: transaction.date * 1000,
					amount: transaction.amount_due,
					transactionID: transaction.charge,
					subscriptionID: transaction.lines.data[0].id
				};

				stripe.customers.retrieveSubscription( customer, subscription, function( error, subscription ) {
					donation.campaign = subscription.metadata.campaign;

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
