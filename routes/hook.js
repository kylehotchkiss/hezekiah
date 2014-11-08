//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var hooks = require("../library/hooks.js");
var stripe = require("stripe")( process.env.HEZ_STRIPE_API );

exports.dispatcher = function( req, res ) {
	var stripeEvent = req.body;
	var transaction = stripeEvent.data.object;

	if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.funds_withdrawn" ) {
        console.log( stripeEvent );

        // Set transactions to "refunded"
    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
		//
		// Recurring Donations successfully made
		//
		var customer = transaction.customer;
		var subscription = transaction.subscription;

        var donation = {
			recurring: true,
			customerID: customer,
			subscription: subscription,
			stripeID: transaction.charge,
			amount: ( transaction.amount_due / 100 ),
			date: new Date( transaction.date * 1000 ).getTime(),
		};

		stripe.customers.retrieveSubscription( customer, subscription, function( error, subscription ) {			
			donation.name = subscription.metadata.name;
			donation.email = subscription.metadata.email;
			donation.campaign = subscription.metadata.campaign;
			donation.campaignName = subscription.metadata.campaignName;

			hooks.postDonate( donation );
		});
    } else if ( stripeEvent.type === "customer.subscription.created" ) {
		var customer = transaction.customer;
		var subscription = transaction.id;

		stripe.customers.retrieveSubscription( customer, subscription, function( error, subscription ) {
			console.log( subscription )

			/*hooks.postSubscribe({
				name: transaction.metadata.name,
				email: transaction.metadata.email,
				campaignName: transaction.metadata.campaignName
			});*/
		});
	} else if ( stripeEvent.type === "customer.subscription.deleted" ) {
        console.log( stripeEvent );

        // Delete subscription
    }

	// plan changed, deleted,
	// customer deleted
	// throw Blunder issues

	res.send(200);
};

exports.backup = function( req, res ) {

};
