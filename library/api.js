//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2015 Illuminate Nations
// All Rights Reserved
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var meta = require('../package.json');

exports.error = function( req, res, error, message, fields ) {
    var response = {
        error: error,
        status: "error",
        message: message,
        version: meta.version
    }

    if ( fields ) {
        response.fields = fields;
    }

    res.status( 400 ).json( response );
}

exports.success = function() {

}
