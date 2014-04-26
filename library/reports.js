//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var database = require("../models");

module.exports = {
    donors: {
        name: "Latest Donors",
        description: "A list of the latest donors",
        generate: function( callback ) {
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
                        var dateTime = d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear();

                        donationsTable.push({
                            Date: dateTime,
                            Name: donation.donorName,
                            Email: donation.donorEmail,
                            Amount: "$" + donation.amount,
                            Campaign: '<a href="/admin/campaigns/' + donation.campaign + '">' + donation.campaign + '</a>',
                            //Subcampaign: donation.subcampaign || "",
                            Details: '<a href="https://manage.stripe.com/payments/' + donation.stripeID + '">Details</a>'
                        })
                    }

                    callback({
                        status: "success",
                        data: donationsTable
                    })
                }
            });
        }
    },

    donorsbyemail: {
        name: "Donors, by Email",
        description: "A list of donors (grouped by email)",
        generate: function( callback ) {
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
                    var donors = {};
                    var donorsTable = [];

                    for ( var i in donations ) {
                        var donation = donations[i];

                        // Date Formatting
                        var d = new Date(donation.createdAt);
                        var dateTime = d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear();

                        if ( typeof donors[donation.donorEmail] !== "undefined" ) {
                            // Concatinate donation amount
                            donors[donation.donorEmail].Amount += donation.amount

                            if ( d.getTime() > new Date( donors[donation.donorEmail].createdAt ).getTime() ) {
                                var d = new Date( donors[donation.donorEmail].createdAt ).getTime();
                                var dateTime = d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear();

                                donors[donation.donorEmail].lastDonation = dateTime;
                            }
                        } else {
                            // Create new donor
                            donors[donation.donorEmail] = {
                                Name: donation.donorName,
                                Email: donation.donorEmail,
                                Amount: donation.amount,
                                lastDonation: dateTime
                            }
                        }
                    }

                    // Make data tabular
                    for ( var i in donors ) {
                        var donor = donors[i];

                        donor.Amount = "$" + donor.Amount;

                        donorsTable.push(donor);
                    }

                    callback({
                        status: "success",
                        data: donorsTable
                    })
                }
            });

        }
    }
}
