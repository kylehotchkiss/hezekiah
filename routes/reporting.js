//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var moment = require("moment");
var database = require("../library/database.js");

exports.monthly = function( req, res ) {

    database.DonationModel.find({ date: { "$gte": moment().startOf('month') } }, function( error, donations ) {
        var campaigns = {};

        for ( var i in donations ) {
            var donation = donations[i];

            if ( typeof campaigns[ donation.campaign ] === "undefined" ) {
                campaigns[ donation.campaign ] = {
                    donations: 1,
                    amount: donation.amount
                };
            } else {
                campaigns[ donation.campaign ].donations += 1;
                campaigns[ donation.campaign ].amount += donation.amount;
            }
        }

        res.send( JSON.stringify( campaigns, null, 4 ) );
    });
};
