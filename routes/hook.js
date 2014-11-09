//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var hooks = require("../library/hooks.js");
var stripe = require("stripe")( process.env.HEZ_STRIPE_API );

exports.dispatcher = function( req, res ) {
	var customer, subscription;

	var stripeEvent = req.body;
	var transaction = stripeEvent.data.object;

	if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.funds_withdrawn" ) {
		//
		// Refund or dispute successfully processed
		//
        console.log( stripeEvent );

        // Set transactions to "refunded"
    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
		//
		// Recurring Donations successfully made
		//

		customer = transaction.customer;
		subscription = transaction.subscription;

        var donation = {
			recurring: true,
			customerID: customer,
			subscription: subscription,
			stripeID: transaction.charge,
			amount: ( transaction.amount_due / 100 ),
			date: transaction.date * 1000,
		};

		stripe.customers.retrieveSubscription( customer, subscription, function( error, subscription ) {
			donation.name = subscription.metadata.name;
			donation.email = subscription.metadata.email;
			donation.campaign = subscription.metadata.campaign;
			donation.campaignName = subscription.metadata.campaignName;

			hooks.postDonate( donation );
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
			campaignName: transaction.metadata.campaignName
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
			campaignName: transaction.metadata.campaignName
		});
    }

	// plan changed, deleted,
	// customer deleted
	// throw Blunder issues

	res.send(200);
};

exports.backup = function( req, res ) {

};
