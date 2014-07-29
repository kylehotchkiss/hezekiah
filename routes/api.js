//
// Illuminate Nations - DonateServ v0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var swig = require("swig");
var express = require('express');
var database = require('../models');
var helpers = require('../library/helpers.js');

module.exports = function() {
    var app = express();

    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/../views');

    swig.setDefaults({ autoescape: false });

    app.get('/statusboard/:key', function( req, res ) {
        var key = req.param("key");

        if ( key === process.env.DS_STATUS_KEY ) {
            database.Donation.findAll().error(function( error ) { // todo narrow down to campaign
                callback({
                    status: "failure",
                    error: {
                        reason: "dberror"
                    }
                });
            }).success(function( donations ) {
                if ( donations === null ) {
                    callback({
                        status: "unavailable",
                        error: {
                            reason: "nxdonations"
                        }
                    })
                } else {
                    donations = donations.reverse();
                    var donationsTable = [];

                    for ( var i in donations ) {
                        var donation = donations[i];

                        var d = new Date(donation.createdAt);
                        var dateTime = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();

                        donationsTable.push({
                            Date: dateTime,
                            Amount: "$" + donation.amount,
                            Campaign: donation.campaign
                        })
                    }

                    res.render("api/statusboard", { data: donationsTable });
                }
            });
        }
    });


    app.get('/:campaign', function( req, res ) {
        var campaign = req.param("campaign");

        database.Campaign.find({ where: { slug: campaign } }).error(function( error ) {
            helpers.json("failure", null, error, res);
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                helpers.json("failure", null, { reason: "nxcampaign" }, res);
            } else {
                // Only return API if campaign goal is set
                if ( campaignObj.goal && campaignObj.goalPeriod ) {
                    var query;

                    if ( campaignObj.goalPeriod === "monthly" ) {
                        var d = new Date();

                        query = {
                            where: {
                                campaign: campaign,
                                createdAt: {
                                    gte: new Date( d.getFullYear(), d.getMonth(), 1 )
                                }
                            }
                        }
                    } else {
                        query = {
                            where: {
                                campaign: campaign
                            }
                        }
                    }

                    database.Donation.findAll( query ).error(function( error ) { // todo narrow down to campaign
                        helpers.json("failure", null, error, res);
                    }).success(function( donations ) {
                        var sum = 0;
                        var total = 0;

                        for ( var i in donations ) {
                            var donation = donations[i];

                            sum += donation.amount;

                            total++;
                        }

                        var data = {
                            name: campaignObj.name,
                            goal: campaignObj.goal,
                            goalPeriod: campaignObj.goalPeriod,
                            percentage: (( sum / campaignObj.goal ) * 100).toFixed( 2 ),
                            total: sum
                        }

                        helpers.json("success", data, null, res);
                    });
                } else {
                    error = {
                        reason: "nxgoal",
                        description: "A goal was not set for this campaign, so aggregate data is not provided."
                    };

                    helpers.json("unavailable", null, error, res);
                }
            }
        });
    });

    return app;
}();
