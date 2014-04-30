//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var express = require('express');
var database = require('../models');
var helpers = require('../library/helpers.js');

module.exports = function() {
    var app = express();

    app.get('/:campaign', function( req, res ) {
        var campaign = req.param("campaign");

        database.Campaign.find({ where: { slug: campaign } }).error(function( error ) {
            helpers.json("failure", null, error, res);
        }).success(function( campaignObj ) {
            if ( campaignObj === null ) {
                helpers.json("failure", null, { reason: "nxcampaign" }, res);
            } else {
                if ( campaignObj.goal ) {
                    database.Donation.findAll({ where: { campaign: campaign }}).error(function( error ) { // todo narrow down to campaign
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
                            percentage: ((sum / campaignObj.goal) * 100).toFixed(2),
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
