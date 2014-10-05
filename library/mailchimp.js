//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//
// TODO: Use config.json variables
//

var async = require("async");
var request = require("request");

var mailchimpBase = "https://us7.api.mailchimp.com/2.0/";
var mailchimpAPI = process.env.DS_MAILCHIMP_API;
var mailchimpList = process.env.DS_MAILCHIMP_LIST;


//
// Check Mailchimp for "Campaigns" field.
// Create if not present.
//
var campaignField = function( callback ) {
    request({
        url: mailchimpBase + "/lists/interest-groupings.json",
        json: true,
        method: "post",
        body: {
            id: mailchimpList,
            apikey: mailchimpAPI
        }
    }, function( error, response, body ) {
        var exists = false;

        for ( var i in body ) {
            var group = body[i];

            if ( group.name === "Campaigns" ) {
                exists = true;
            }
        }

        if ( !exists ) {
            request({
                url: mailchimpBase + "/lists/interest-grouping-add.json",
                json: true,
                method: "post",
                body: {
                    id: mailchimpList,
                    type: "hidden",
                    name: "Campaigns",
                    groups: ["general"], // We'll always have a campaign called "general"
                    apikey: mailchimpAPI
                }
            }, function( error, response, body ) {
                if ( error ) {
                    callback( error, false );
                } else if ( typeof body.status === "string" ) {
                    callback( body, false );
                } else {
                    callback( false, body );
                }
            });
        } else {
            callback( false, true );
        }
    });
}


//
// Check Mailchimp Campaigns Field for campaign
// Create if not present.
//
var campaignValue = function( campaignSlug, callback ) {
    request({
        url: mailchimpBase + "/lists/interest-groupings.json",
        json: true,
        method: "post",
        body: {
            id: mailchimpList,
            apikey: mailchimpAPI
        }
    }, function( error, response, body ) {
        var exists = false;
        var grouping;
        var groupingID;

        for ( var i in body ) {
            var group = body[i];

            if ( group.name === "Campaigns" ) {
                grouping = i;
                groupingID = group.id;
            }
        }

        for ( var j in body[grouping].groups ) {
            var campaign = body[grouping].groups[j];

            if ( campaign.name === campaignSlug ) {
                exists = true;
            }
        }

        if ( !exists ) {
            request({
                url: mailchimpBase + "/lists/interest-group-add.json",
                json: true,
                method: "post",
                body: {
                    id: mailchimpList,
                    group_name: campaignSlug,
                    grouping_id: groupingID,
                    apikey: mailchimpAPI
                }
            }, function( error, response, body ) {
                if ( error ) {
                    callback( error, false );
                } else if ( typeof body.status === "string" ) {
                    callback( body, false );
                } else {
                    callback( false, body );
                }
            });
        } else {
            callback( false, true );
        }
    });
}

exports.subscribeEmail = function( name, email, lists, ip, callback ) {
    campaignField(function( error ) {
        if ( typeof lists === "string" ) {
            lists = [ lists ];
        }

        async.eachSeries(lists, function( list, callback ) {
            campaignValue(list, function( error ) {
                callback( error );
            });
        }, function( error ) {
            request({
                url: mailchimpBase + "/lists/subscribe.json",
                json: true,
                method: "post",
                body: {
                    id: mailchimpList,
                    apikey: mailchimpAPI,
                    double_optin: false,
                    update_existing: true,
                    replace_interests: false,
                    email: { email: email },
                    merge_vars: {
                        name: name,
                        optin_ip: ip,
                        groupings: [{
                            name: "Campaigns",
                            groups: lists
                        }]
                    }
                }
            }, function( error, response, body ) {
                if ( typeof callback === "function" ) {
                    if ( error ) {
                        callback( error, false );
                    } else if ( typeof body.status === "string" ) {
                        callback( body, false );
                    } else {
                        callback( false, body );
                    }
                }
            });
        })
    });
}
