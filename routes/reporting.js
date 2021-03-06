//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

var S = require("string");
var moment = require("moment");
var database = require("../models");
var stringify = require('csv-stringify');

var amount = function( value ) {
    return '$' + ( value / 100 ).toFixed( 2 );
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
                ID: donation.id,
                Name: donation.Donor.name,
                Campaign: donation.campaign,
                Date: moment( donation.createdAt ).format('MM/DD/YYYY'),
                Amount: amount( donation.amount - donation.transactionFee )
            };
        });

        if ( req.csv ) {
            stringify(donations, { header: true }, function( error, output ) {
                res.set('Content-Type', 'text/csv');
                res.send( output );
            });
        } else {
            res.render('reporting/report.html', { title: 'Monthly Summary', csv: true, donations: JSON.stringify( donations ) });
        }
    });
};

exports.annual = function( req, res ) {
    var year = parseInt( req.param('year') || moment().format('YYYY') );
    var start = moment( year + '-1-1', 'YYYY-MM-DD' ).toDate();
    var end = moment( ( year + 1 ) + '-1-1', 'YYYY-MM-DD' ).toDate();

    database.Donation.findAll({ where: { createdAt: { gte: start, lt: end } }, include: [ database.Donor ], order: '"createdAt" DESC' }).then(function( donationsObj ) {
        var donations = donationsObj.map(function( donation, i ) {
            return {
                ID: donation.id,
                Name: donation.Donor.name,
                Campaign: donation.campaign,
                Date: moment( donation.createdAt ).format('MM/DD/YYYY'),
                Amount: amount( donation.amount - donation.transactionFee )
            };
        });

        if ( req.csv ) {
            stringify(donations, { header: true }, function( error, output ) {
                res.set('Content-Type', 'text/csv');
                res.send( output );
            });
        } else {
            res.render('reporting/report.html', {  title: 'Annual Summary', csv: true, donations: JSON.stringify( donations ) });
        }
    });
};

exports.donors = function( req, res ) {
    database.Donor.findAll({ include: [ database.Donation ], order: '"updatedAt" DESC' }).then(function( donorsObj ) {
        var donors = donorsObj.map(function( donor, i ) {
            var ytd = 0;
            var total = 0;

            // TODO: We can probably aggregate this in SQL for speed in the future
            donor.Donations.map(function( donation, i ) {
                if ( moment( donation.createdAt ).isAfter( moment().startOf('year') ) ) {
                    ytd += ( donation.amount - donation.transactionFee );
                }

                total += donation.amount - donation.transactionFee;
            });

            return {
                ID: donor.id,
                Name: donor.name,
                Email: donor.email,
                "Last Edited": moment( donor.updatedAt ).format('MM/DD/YYYY'),
                "YTD": amount( ytd ),
                "Total": amount( total )
            };
        });

        if ( req.csv ) {
            stringify(donors, { header: true }, function( error, output ) {
                res.set('Content-Type', 'text/csv');
                res.send( output );
            });
        } else {
            res.render('reporting/report.html', { title: 'Donors', csv: true, donations: JSON.stringify( donors ) });
        }
    });
};

exports.referrers = function( req, res ) {
    database.Donation.aggregate('*', 'count', {
        plain: false,
        group: ['referrer'],
        attributes: ['referrer'],
        order: '"count" DESC',
    }).then(function( countObj ) {
        var referrers = countObj.map(function( referrer, i ) {
            if ( typeof referrer.referrer !== 'undefined' && referrer.referrer ) {
                return {
                    URL: referrer.referrer,
                    total: referrer.count
                };
            }
        });

        if ( req.csv ) {
            stringify(referrers, { header: true }, function( error, output ) {
                res.set('Content-Type', 'text/csv');
                res.send( output );
            });
        } else {
            res.render('reporting/report.html', {  title: 'Referrers', csv: true, donations: JSON.stringify( referrers ) });
        }
    });
};

exports.campaigns = function( req, res ) {
    database.Campaign.findAll({ include: [ database.Donation ] } ).then(function( campaignsObj ) {
        var campaigns = campaignsObj.map(function( campaign, i ) {
            var total = 0;
            var count = 0;

            campaign.Donations.map(function( donation, j ) {
                total += donation.amount - donation.transactionFee;
                count++;
            });

            campaign.total = amount( total );
            campaign.count = count;

            return campaign;
        });

        res.render("reporting/campaigns.html", {  title: 'Campaigns', campaigns: campaigns });
    });
};

exports.recurring = function( req, res ) {
    database.Recurring.findAll({
        where: { active: true },
        include: [ { model: database.Donor } ]
    }).then(function( recurringObj ) {
        var subscriptions = recurringObj.map(function( recurring, i ) {
            table = {
                ID: recurring.id,
                Name: recurring.Donor.name,
                Campaign: recurring.campaign,
                "Date Started": moment( recurring.createdAt ).format('MM/DD/YYYY'),
                Amount: amount( recurring.amount )
            };

            // Custom Fields
            if ( recurring.metadata ) {
                if ( typeof recurring.metadata.custom !== 'undefined' ) {
                    for ( var j in recurring.metadata.custom ) {
                        table[ S( j ).humanize().s ] = recurring.metadata.custom[j];
                    }
                }
            }

            return table;
        });

        var data = {
            title: 'Monthly Donors',
            donations: JSON.stringify( subscriptions )
        };

        res.render('reporting/report.html', data);
    });
};

exports.campaign = function( req, res ) {
    var campaign = req.param('campaign');

    database.Campaign.find({
        where: { slug: campaign },
        include: {
            model: database.Donation,
            include: [{ model: database.Donor }, { model: database.Subcampaign }]
        },
        order: [
            [ database.Donation, 'createdAt', 'DESC' ]
        ]
    }).then(function( campaignObj ) {
        if ( campaignObj.mode === 'ticketed' ) {
            database.Donation.aggregate('*', 'count', {
                plain: false,
                where: { campaign: campaign },
                group: ['subcampaign'],
                attributes: ['subcampaign'],
                order: '"count" DESC',
            }).then(function( countObj ) {
                next( countObj );
            });
        } else {
            next( false );
        }

        function next( subcampaigns ) {
            var donations = campaignObj.Donations.map(function( donation, i ) {
                var table;

                if ( campaignObj.mode === 'ticketed' ) {
                    table = {
                        "Name": donation.Donor.name,
                    };

                    if ( donation.Subcampaign ) {
                        table.Type = donation.Subcampaign.name;
                    }
                } else {
                    table = {
                        "Date": moment( donation.createdAt ).format('MM/DD/YYYY'),
                        "Name": donation.Donor.name,
                        "Amount": amount( donation.amount - donation.transactionFee )
                    };

                    if ( donation.Subcampaign ) {
                        table.Designation = donation.Subcampaign.name;
                    }
                }

                // Custom Fields
                if ( donation.metadata ) {
                    if ( typeof donation.metadata.custom !== 'undefined' ) {
                        for ( var j in donation.metadata.custom ) {
                            table[ S( j ).humanize().s ] = donation.metadata.custom[j];
                        }
                    }
                }

                return table;
            });

            var data = {
                title: campaignObj.slug + ' Campaign',
                donations: JSON.stringify( donations )
            };

            if ( subcampaigns ) {
                data.subcampaigns = subcampaigns;
            }

            res.render('reporting/report.html', data);
        }
    });
};
