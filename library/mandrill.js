//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var send = function( email, subject, content, template, callback ) {
    var loadedTemplate;
    var send = true;

    // Swig uses sync error handling so we try-catch specifically for whether or
    // not we can load the template file here.
    // TODO: This seems safe since the template name is only set from private
    // functions but just double check any ramifications of FS access.
    try {
        loadedTemplate = swig.compileFile("./emails/" + template + ".html");
    } catch( error ) {
        send = false;
    }

    









var swig = require("swig");
var request = require("request");
var config = require("../config.json");

var mandrillBase = "https://mandrillapp.com/api/1.0/";
var mandrillAPI = process.env.DS_MANDRILL_API;

var messageBuilder = function( donation, campaign, callback ) {
    // TODO should check emailTemplate for EXEC safety

    if ( campaign.emailTemplate ) {
        var d = new Date(donation.time);
        var dateTime = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();

        var emailContent = swig.render( campaign.emailTemplate, {
            varControls: ['[[', ']]'],
            locals: {
                date: dateTime,
                name: donation.name,
                campaign: campaign.name,
                amount: "$" + donation.amount
            }
        });

        callback( emailContent );
    } else {
        callback( false );
    }
}

exports.sendEmail = function( donation, campaign, intent, callback ) {
    messageBuilder( donation, campaign, function( emailContent ) {
        if ( emailContent ) {
            request({
                url: mandrillBase + '/messages/send-template.json',
                json: true,
                method: "post",
                body: {
                    key: mandrillAPI,
                    async: true,
                    template_name: config.email.template,
                    template_content: [{
                        "name": "std_content00",
                        "content": emailContent
                    }],
                    message: {
                        to: [{ email: donation.email, name: donation.name }],
                        tags: [intent],
                        subject: campaign.emailSubject, // TODO - from func
                        auto_text: true,
                        from_name: config.organization.name,
                        inline_css: false, // We inline it
                        from_email: config.email.fromEmail,
                        track_opens: true,
                        signing_domain: config.organization.hostname,
                        view_content_link: false,
                        google_analytics_domains: [ config.organization.hostname ],
                        google_analytics_campaign: "mandrill"
                    }
                }
            }, function( error, response, body ) {
                if ( typeof callback === "function" ) {
                    callback();
                }
            });
        } else {
            if ( typeof callback === "function" ) {
                callback();
            }
        }
    });
};
