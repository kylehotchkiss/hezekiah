//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

exports.dispatcher = function( req, res ) {
	var stripeEvent = req.body;

	console.log( stripeEvent )

	res.send(200);
}

exports.backup = function( req, res ) {

}
