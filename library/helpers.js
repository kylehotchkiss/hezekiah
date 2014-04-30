//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var meta = require("../package.json");

module.exports = {
    json: function( status, data, error, res ) {
        var response = {
            status: status,
            timestamp: new Date().getTime(),
            server: meta.name + " v" + meta.version
        }

        if ( error ) {
            response.error = error;
        } else if ( data ) {
            response.data = data;
        }

        res.json( response );
    }
}
