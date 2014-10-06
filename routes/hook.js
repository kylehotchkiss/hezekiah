//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

exports.dispatcher = function( req, res ) {
	var stripeEvent = req.body;

	if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.funds_withdrawn" ) {
        console.log( stripeEvent )

        // Set transactions to "refunded"
    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
        console.log( stripeEvent )

        // Payment confirmed actions
    } else if ( stripeEvent.type === "customer.subscription.deleted" ) {
        console.log( stripeEvent )

        // Delete subscription
    }

	res.send(200);
}

exports.backup = function( req, res ) {

}
