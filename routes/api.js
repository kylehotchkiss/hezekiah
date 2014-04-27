//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var express = require('express');
var database = require('../models');

var meta = require('../package.json');

module.exports = function() {
    var app = express();

    app.get('/:campaign', function( req, res ) {
        var campaign = req.param("campaign");

        database.Campaign.find({ where: { slug: campaign } }).error(function( error ) {
            res.json({
                status: "failure",
                timestamp: new Date().getTime(),
                server: meta.name + " v" + meta.version,
                error: {
                    reason: "dberror"
                }
            });
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                res.json({
                    status: "failure",
                    timestamp: new Date().getTime(),
                    server: meta.name + " v" + meta.version,
                    error: {
                        reason: "nxcampaign"
                    }
                });
            } else {
                if ( campaignObj.goal ) {
                    database.Donation.findAll({ where: { campaign: campaign }}).error(function( error ) { // todo narrow down to campaign
                        res.json({
                            status: "failure",
                            timestamp: new Date().getTime(),
                            server: meta.name + " v" + meta.version,
                            error: {
                                reason: "dberror",
                                description: error
                            }
                        });
                    }).success(function( donations ) {
                        var sum = 0;
                        var total = 0;

                        for ( var i in donations ) {
                            var donation = donations[i];

                            sum += donation.amount;

                            total++;
                        }

                        res.json({
                            status: "success",
                            timestamp: new Date().getTime(),
                            server: meta.name + " v" + meta.version,
                            data: {
                                name: campaignObj.name,
                                goal: campaignObj.goal,
                                percentage: ((sum / campaignObj.goal) * 100).toFixed(2),
                                total: sum
                            }
                        });
                    });
                } else {
                    res.json({
                        status: "unavailable",
                        timestamp: new Date().getTime(),
                        server: meta.name + " v" + meta.version,
                        error: {
                            reason: "nxgoal",
                            description: "A goal was not set for this campaign, so aggregate data is not provided."
                        }
                    });
                }
            }
        });
    });

    return app;
}();
