//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var moment = require("moment");
var database = require("../models");

var sidebarContent = function( callback ) {
    //
    // TODO: Why are we getting strings for the amounts here and not integers?
    //
    database.Donation.findAll({ where: { createdAt: { gte: moment().subtract(1, "month").format() }}}).then(function( donations ) {
        if ( donations === null ) {
            callback( false, false );
        } else {
            var now = moment();
            var campaigns = {};
            var campaignsArray = [];

            // Read all data from the donations table
            for ( var i in donations ) {
                var donation = donations[i];

                if ( typeof campaigns[ donation.campaign ] === "undefined" ) {
                    campaigns[ donation.campaign ] = {
                        campaign: donation.campaign,
                        total: 0,
                        donations: []
                    };
                }

                campaigns[ donation.campaign ].total += parseInt(donation.amount);
                campaigns[ donation.campaign ].donations.push({
                    amount: parseInt(donation.amount),
                    offset: moment().diff(moment(donation.createdAt), 'days')
                });
            }

            // Run some data conversions specifc to the sidebar
            for ( var j in campaigns ) {
                var sparkline = [];
                var campaign = campaigns[j];

                for ( var k = 0; k < 31; k++ ) {
                    sparkline[k] = 0;
                }

                for ( var l in campaign.donations ) {
                    var day = campaign.donations[l];

                    sparkline[ day.offset ] += day.amount;
                }

                campaign.sparkline = sparkline.toString();
                delete campaign.donations;

                campaignsArray.push( campaign );
            }

            campaignsArray.sort(function( a, b ) {
                if ( a.total < b.total ) {
                    return 1;
                } else if ( a.total > b.total ) {
                    return -1;
                } else {
                    return 0;
                }
            });

            callback( false, campaignsArray );
        }
    }, function( error ) {
        callback( error, false );
    });
};


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


var processDonations = function( donationsObj ) {
    var campaigns = {};
    var dates = {};
    var graph = { labels: [], series: [] };

    donations = filter( donationsObj );

    for ( var i in donationsObj ) {
        var donation = donationsObj[i];
        var dateString = moment( donation.createdAt ).format("MM-DD-YYYY");

        if ( typeof dates[dateString] === "undefined" ) {
            dates[dateString] = 0;
        }

        dates[dateString] += parseInt( ( donation.amount / 100 ).toFixed(0) );
    }

    for ( var j in dates ) {
        var col = dates[j];

        graph.labels.push( j );
        graph.series.push( col );
    }

    return {
        graph: graph,
        donations: donations
    };
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

exports.latest = function( req, res ) {
    sidebarContent( function( error, content ) {
        var sidebar = !error ? content : false;

        database.Donation.findAll({ include: [ database.Donor ], order: '"updatedAt" DESC' }).then(function( donationsObj ) {
            var output = processDonations( donationsObj );

            res.render("reporting/report.html", { graph: output.graph, report: output.donations, sidebar: sidebar, slug: "latest" });
        });
    });
};

exports.monthly = function( req, res ) {
    sidebarContent( function( error, content ) {
        var sidebar = !error ? content : false;

        database.Donation.findAll({ where: { createdAt: { "gte": moment().startOf("month").format() } }, include: [ database.Donor ], order: '"updatedAt" DESC' }).then(function( donationsObj ) {
            var output = processDonations( donationsObj );

            res.render("reporting/report.html", { graph: output.graph, report: output.donations, sidebar: sidebar, slug: "monthly" });
        });
    });
};

exports.annual = function( req, res ) {
    sidebarContent( function( error, content ) {
        var sidebar = !error ? content : false;

        database.Donation.findAll({ where: { createdAt: { "gte": moment().startOf("year").format() } }, include: [ database.Donor ], order: '"updatedAt" DESC' }).then(function( donationsObj ) {
            var output = processDonations( donationsObj );

            res.render("reporting/report.html", { graph: output.graph, report: output.donations, sidebar: sidebar, slug: "annual" });
        });
    });
};

exports.donors = function( req, res ) {

    database.Donation.findAll({ include: [ database.Donor ] }).then(function( donorsObj ) {
        console.log( donorsObj )
        res.render("reporting/report.html", { report: donorsObj });
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
