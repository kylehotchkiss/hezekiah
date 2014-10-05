//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

exports.dispatcher = function( req, res ) {
	var event = JSON.parse( req.body );
	
	console.log( event )
	
	response.send(200);
}