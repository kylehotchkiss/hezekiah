//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var hooks = require("../library/hooks.js");

exports.dispatcher = function( req, res ) {
	var stripeEvent = req.body;

	if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.funds_withdrawn" ) {
        console.log( stripeEvent );

        // Set transactions to "refunded"
    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
		console.log( stripeEvent.data );

        var donation = {
			recurring: true,
			ip: stripeEvent.data.metadata.ip,
			stripeID: stripeEvent.data.charge,
			amount: stripeEvent.data.amount_due,
			name: stripeEvent.data.metadata.name,
			customerID: stripeEvent.data.customer,
			email: stripeEvent.data.metadata.email,
			postal: stripeEvent.data.metadata.postal,
			campaign: stripeEvent.data.metadata.campaign,
			date: new Date(stripeEvent.data.date).getTime(),
			campaignName: stripeEvent.data.metadata.campaignName
		}

		hook.postDonate( donation );
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
