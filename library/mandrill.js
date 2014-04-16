//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var swig = require("swig");
var request = require("request");
var config = require("../config.json");

var mandrillBase = "https://mandrillapp.com/api/1.0/";
var mandrillAPI = process.env.DS_MANDRILL_API || "t2znvocdNFzqk5UwE1R8eA";

var messageBuilder = function( donation, cause, callback ) {
    // TODO should check emailTemplate for EXEC safety

    if ( cause.emailTemplate ) {
        var emailContent = swig.render( cause.emailTemplate, {
            locals: {
                name: donation.name,
                cause: cause.name,
                amount: donation.amount
            }
        });

        callback( emailContent );
    } else {
        callback( false );
    }
}

exports.sendEmail = function( donation, cause, intent, callback ) {
    messageBuilder( donation, cause, function( emailContent ) {
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
                        to: [{ email: donation.email, name: donation.name }], // from func
                        tags: [intent], // Consider - recurring vs one, unsub, etc intent param
                        subject: "example subject", // from func
                        auto_text: true,
                        from_name: config.organization.name,
                        inline_css: true,
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

