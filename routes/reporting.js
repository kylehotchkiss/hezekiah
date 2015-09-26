//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

var S = require("string");
var moment = require("moment");
var database = require("../models");

var amount = function( value ) {
    return '$' + ( value / 100 ).toFixed( 2 );
};

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
    var donors = {};
    var fees = 0;
    var total = 0;
    var donorCount = 0;

    donations = filter( donationsObj );

    for ( var i in donationsObj ) {
        var donation = donationsObj[i];
        var dateString = moment( donation.createdAt ).format("MM-DD-YYYY");

        if ( typeof dates[dateString] === "undefined" ) {
            dates[dateString] = 0;
        }

        dates[dateString] += parseInt( ( donation.amount / 100 ).toFixed(0) );
        total += donation.amount;
        fees += donation.transactionFee;

        if ( typeof donors[ donation.email ] === "undefined" ) {
            donors[ donation.email ] = true;

            donorCount++;
        }
    }

    for ( var j in dates ) {
        var col = dates[j];

        graph.labels.push( j );
        graph.series.push( col );
    }

    return {
        graph: graph,
        donations: donations,
        summaries: {
            fees: fees,
            total: total,
            donors: donorCount
        }
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

exports.monthly = function( req, res ) {
    database.Donation.findAll({ where: { createdAt: { gte: moment().startOf('month').toDate() } }, include: [ database.Donor ], order: '"createdAt" DESC' }).then(function( donationsObj ) {
        var donations = donationsObj.map(function( donation, i ) {
            return {
                date: moment( donation.createdAt ).format('MM/DD/YYYY'),
                name: donation.Donor.name,
                campaign: donation.campaign,
                amount: amount( donation.amount )
            };
        });

        res.render('reporting/report.html', { donations: JSON.stringify( donations ) });
    });
};

exports.annual = function( req, res ) {
    database.Donation.findAll({ where: { createdAt: { gte: moment().startOf('year').toDate() } }, include: [ database.Donor ], order: '"createdAt" DESC' }).then(function( donationsObj ) {
        var donations = donationsObj.map(function( donation, i ) {
            return {
                date: moment( donation.createdAt ).format('MM/DD/YYYY'),
                name: donation.Donor.name,
                campaign: donation.campaign,
                amount: amount( donation.amount )
            };
        });

        res.render('reporting/report.html', { donations: JSON.stringify( donations ) });
    });
};

exports.donors = function( req, res ) {
    database.Donor.findAll({ order: '"updatedAt" DESC'}).then(function( donorsObj ) {
        var donors = donorsObj.map(function( donor, i ) {
            return {
                name: donor.name,
                email: donor.email,
                monthlyDonor: donor.subscriber ? "Yes" : "No",
                lastEdited: moment( donor.updatedAt ).format('MM/DD/YYYY'),
            };
        });

        res.render('reporting/report.html', { donations: JSON.stringify( donors ) });
    });
};

exports.referrers = function( req, res ) {
    database.Donation.aggregate('referrer', 'DISTINCT', { plain: false })
        .map( function( row ) { console.log( row ); return row.DISTINCT; })
        .then( function( referrers ) {
            res.send( JSON.stringify( referrers ) );
        });
};

exports.campaigns = function( req, res ) {
    database.Campaign.findAll({ include: [ database.Donation ] } ).then(function( campaignsObj ) {
        var campaigns = campaignsObj.map(function( campaign, i ) {
            var total = 0;
            var count = 0;

            campaign.Donations.map(function( donation, j ) {
                total += donation.amount;
                count++;
            });

            campaign.total = amount( total );
            campaign.count = count;

            return campaign;
        });

        res.render("reporting/campaigns.html", { campaigns: campaigns });
    });
};

exports.campaign = function( req, res ) {
    var campaign = req.param('campaign');

    database.Campaign.find({
        where: { slug: campaign },
        include: {
            order: '"createdAt" DESC',
            model: database.Donation,
            include: [{ model: database.Donor }, { model: database.Subcampaign }]
        }
    }).then(function( campaignObj ) {
        var donations = campaignObj.Donations.map(function( donation, i ) {
            var table;

            if ( campaignObj.mode === 'ticketed' ) {
                table = {
                    "Name": donation.Donor.name,
                    "Type": donation.Subcampaign.name,
                };
            } else {
                table = {
                    "Date": moment( donation.createdAt ).format('MM/DD/YYYY'),
                    "Name": donation.Donor.name,
                    "Designation": donation.Subcampaign.name,
                    "Amount": amount( donation.amount )
                };
            }

            // Custom Fields
            if ( typeof donation.metadata.custom !== 'undefined' ) {
                for ( var j in donation.metadata.custom ) {
                    table[ S( j ).humanize().s ] = donation.metadata.custom[j];
                }
            }

            return table;
        });

        res.render('reporting/report.html', { donations: JSON.stringify( donations ) });
    });
};
