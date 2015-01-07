//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var moment = require("moment");
var database = require("../models");

var filter = function( input ) {
    var start = new Date().getTime();
    output = input;

    if ( Array.isArray( output ) ) {
        for ( var i in output ) {
            output[i]._id = undefined;
            output[i].__v = undefined;

            for ( var j in output[i] ) {
                if ( typeof output[i][j] === "object" && output[i][j] !== null ) {
                    if ( typeof output[i][j]._id !== "undefined" ) {
                        output[i][j]._id = undefined;
                    }

                    if ( typeof output[i][j].__v !== "undefined" ) {
                        output[i][j].__v = undefined;
                    }
                }
            }
        }
    } else {
        output._id = undefined;
        output.__v = undefined;

        for ( var k in output ) {
            if ( typeof output[k] === "object" ) {
                output[k]._id = undefined;
                output[k].__v = undefined;
            }
        }
    }

    var end = new Date().getTime();
    var time = (( end - start ) / 1000 );

    return output;
};

// Monthly * Annual * Donors * Latest * Campaigns

// Monthly
// Graph of performance, by week, by campaign
// three quick stats
//      Total / Donors /
// table of donations
//

// Annual
// Graph of performance, by month, by campaign
// three quick states
// table of donations

// Donors
// Table of Donors

// Donors/%donor%
// Formatted Donor Info
// Table of donations

// Latest
// Table of

exports.monthly = function( req, res ) {

    database.DonationModel.find({ date: { "$gte": moment().startOf("month") } }).populate("donor").exec(function( error, donations ) {
        res.send( JSON.stringify( filter( donations ) , null, 4 ) );
    });

};

exports.annual = function( req, res ) {

    database.DonationModel.find({ subscriber: true }).exec(function( error, donors ) {
        res.send( JSON.stringify( donors, null, 4 ) );
    });

};

exports.donors = function( req, res ) {

    database.DonationModel.find().sort([ [ "lastAction", "descending" ] ]).exec(function( error, donors ) {
        res.render("reporting/report.html", { report: donors });
    });

};

exports.latest = function( req, res ) {

    database.DonationModel
        .find({ date: { "$gte": moment().startOf("month") } })
        .sort({ date: "desc" })
        .populate( "donor" )
        .exec(function( error, donations ) {
            var campaigns = {};
            var dates = {};
            var graph = { labels: [], series: [] };

            donations = filter( donations );

            for ( var i in donations ) {
                var donation = donations[i];
                var dateString = moment( donation.date ).format("MM-DD-YYYY");

                if ( typeof dates[dateString] !== "undefined" ) {
                    dates[dateString] = 0;
                }

                dates[dateString] += donation.amount;
            }

            for ( var j in dates ) {
                var col = dates[j];

                graph.labels.push( j );
                graph.series.push( col );
            }

            res.render("reporting/report.html", { graph: graph, report: donations });
        });

};

exports.campaigns = function( req, res ) {

    database.DonationModel.find().exec(function( error, donations ) {
        var campaigns = {};

        for ( var i in donations ) {
            var donation = donations[i];

            if ( campaigns[ donation.campaign ] ) {
                campaigns[ donation.campaign ].quantity++;
                campaigns[ donation.campaign ].amount += donation.amount;
                campaigns[ donation.campaign ].lastDonation = donation.date;
            } else {
                campaigns[ donation.campaign ] = {
                    quantity: 1,
                    amount: donation.amount,
                    firstDonation: donation.date
                };
            }
        }

        res.send( JSON.stringify( campaigns, null, 4 ) );
    });

};
