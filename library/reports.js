//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var database = require("../models");
var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

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
                    var donationsTableDownload = [];

                    for ( var i in donations ) {
                        var donation = donations[i];

                        var d = new Date(donation.createdAt);
                        var dateTime = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();

                        donationsTable.push({
                            Date: dateTime,
                            Name: donation.donorName,
                            Email: donation.donorEmail,
                            Amount: "$" + donation.amount,
                            Campaign: '<a href="/admin/campaigns/' + donation.campaign + '">' + donation.campaign + '</a>',
                            Details: '<a href="https://manage.stripe.com/payments/' + donation.stripeID + '">Details</a>'
                        })
                    }

                    for ( var j in donations ) {
                        var donation = donations[j];

                        var d = new Date(donation.createdAt);
                        var dateTime = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();

                        donationsTableDownload.push({
                            Date: dateTime,
                            Name: donation.donorName,
                            Email: donation.donorEmail,
                            Amount: "$" + donation.amount,
                            Campaign: donation.campaign
                        })
                    }

                    callback({
                        status: "success",
                        data: donationsTable,
                        download: donationsTableDownload
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
                        var dateTime = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();

                        if ( typeof donors[donation.donorEmail] !== "undefined" ) {
                            // Concatinate donation amount
                            donors[donation.donorEmail].Amount += donation.amount

                            if ( d.getTime() > new Date( donors[donation.donorEmail].createdAt ).getTime() ) {
                                var d = new Date( donors[donation.donorEmail].createdAt ).getTime();
                                var dateTime = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();

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
    },

    campaigns: {
        name: "Campaigns Summary",
        description: "A list of total donated to each active campaign",
        generate: function( callback ) {
            var campaignsData = {};
            var campaignsGroup = {};
            var campaignsTable = [];

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
                    database.Campaign.findAll().error(function( error ) { // todo narrow down to campaign
                        callback({
                            status: "failure",
                            error: {
                                reason: "dberror"
                            }
                        });
                    }).success(function( campaigns ) {
                        if ( campaigns === null ) {
                            callback({
                                status: "unavailable",
                                error: {
                                    reason: "nxcampaigns"
                                }
                            })
                        } else {
                            // remap campaigns from db to slug-keyed obj
                            for ( var i in campaigns ) {
                                var campaign = campaigns[i];

                                campaignsGroup[campaign.slug] = campaign.dataValues;
                            }

                            // map donations to campaign slug-keyed obj
                            for ( var i in donations ) {
                                var donation = donations[i];

                                if ( campaignsData[donation.campaign] ) {
                                    campaignsData[donation.campaign].count++;
                                    campaignsData[donation.campaign].amount += donation.amount;
                                } else {
                                    campaignsData[donation.campaign] = {
                                        count: 1,
                                        amount: donation.amount
                                    }
                                }
                            }

                            // map campaign aggrigate data to array
                            for ( var i in campaignsData ) {
                                var thisCampaign = campaignsData[i];

                                campaignsTable.push({
                                    Name: campaignsGroup[i].name,
                                    Count: thisCampaign.count,
                                    Amount: "$" + thisCampaign.amount
                                })
                            }

                            callback({
                                status: "success",
                                data: campaignsTable
                            })
                        }
                    });

                }
            });
        }
    },

    campaignsMonthly: {
        name: "Monthly Campaigns Summary",
        description: "Funds raised per-campaign. Monthly, for wires.",
        generate: function( callback ) {
            var campaignsData = {};
            var campaignsGroup = {};
            var campaignsTable = [];

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
                    database.Campaign.findAll().error(function( error ) { // todo narrow down to campaign
                        callback({
                            status: "failure",
                            error: {
                                reason: "dberror"
                            }
                        });
                    }).success(function( campaigns ) {
                        if ( campaigns === null ) {
                            callback({
                                status: "unavailable",
                                error: {
                                    reason: "nxcampaigns"
                                }
                            })
                        } else {
                            var x = 0;
                            var stripe = true;
                            var lastMonth = "";

                            // Reverse donations so they come in proper order:
                            donations.reverse();

                            // remap campaigns from db to slug-keyed obj
                            for ( var i in campaigns ) {
                                var campaign = campaigns[i];

                                campaignsGroup[campaign.slug] = campaign.dataValues;
                            }

                            // map donations to campaign slug-keyed obj
                            for ( var i in donations ) {
                                var donation = donations[i];

                                var d = new Date( donation.createdAt );
                                thisMonth = ( d.getMonth() + 1 ) + "" + d.getFullYear()

                                if ( thisMonth !== lastMonth ) {
                                    lastMonth = thisMonth;
                                    x++;
                                }

                                if ( !campaignsData[x] ) {
                                    campaignsData[x] = {};
                                }

                                if ( campaignsData[x][donation.campaign] ) {
                                    campaignsData[x][donation.campaign].count++;
                                    campaignsData[x][donation.campaign].amount += donation.amount;
                                } else {
                                    campaignsData[x][donation.campaign] = {
                                        month: monthNames[ d.getMonth() ] + " " + d.getFullYear(),
                                        count: 1,
                                        amount: donation.amount
                                    }
                                }
                            }

                            // map campaign aggrigate data to array
                            for ( var i in campaignsData ) {
                                var thisMonth = campaignsData[i];

                                stripe = !stripe;

                                for ( var j in thisMonth ) {
                                    var thisCampaign = thisMonth[j];

                                    campaignsTable.push({
                                        modifier: ( stripe ? "stripe" : "" ),
                                        Month: thisCampaign.month,
                                        Name: campaignsGroup[j].name,
                                        Count: thisCampaign.count,
                                        Amount: "$" + thisCampaign.amount
                                    })
                                }
                            }

                            callback({
                                status: "success",
                                data: campaignsTable
                            })
                        }
                    });

                }
            });
        }
    }
}
