//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var swig = require("swig");
var moment = require("moment");
var numeral = require("numeral");
var request = require("request");
var config = require("../config.json");

var mandrillBase = "https://mandrillapp.com/api/1.0/";
var mandrillAPI = process.env.HEZ_MANDRILL_API;

exports.send = function( email, subject, content, template, callback ) {
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

    if ( send ) {
        if ( typeof content.date === "number" ) {
            content.date = moment( content.date ).format('M/D/YYYY [at] h:mm a');
        }

        if ( typeof content.amount === "number" ) {
            content.amount = numeral( content.amount ).format("0,0.00");
        }

        var compiledTemplate = loadedTemplate( content );

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
                    "content": compiledTemplate
                }],
                message: {
                    to: [{ email: email }],
                    tags: [template],
                    subject: subject,
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
};
