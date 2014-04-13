//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var swig = require("swig");
var request = require("request");
var config = require("../config.json");

var mandrillBase = "https://mandrillapp.com/api/1.0/";
var mandrillAPI = process.env.DS_MANDRILL_API || "t2znvocdNFzqk5UwE1R8eA";

var messageBuilder = function( donation, cause, callback ) {
    // TODO should check emailTemplate for EXEC safety

    var emailContent = swig.render( cause.emailTemplate, {
        locals: {
            name: donation.name,
            cause: cause.name,
            amount: donation.amount
        }
    });

    callback( emailContent );
}

exports.sendEmail = function( donation, cause, intent, callback ) {
    messageBuilder( donation, cause, function( emailContent ) {
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

        if ( typeof callback === "function" ) {
            callback();
        }
    });
};

/*exports.sendEmail({
    email:"kyle@kylehotchkiss.com",
    name:"Kyle Hotchkiss",
    amount: 10
}, {
    name: "General Operations",
    emailTemplate: "<p>Hey {% if name %}{{ name }}{% else %}there{% endif %},</p><p>Thank you for your generous donation{% if amount %} of ${{amount}}{% endif %} to Illuminate Nations{% if cause %} for {{ cause }}{% endif %}! We're a small group of friends trying to make the world a better place by bringing the Gospel to the nations and your donation allows us to be more effective in our American operations. We believe that God wants us to make a difference here in our own home and your donation helps us to do just that by allowing us to spread our dream to more people through digital media. We appreciate your support and encouragement!</p><p>Please keep this email receipt as proof of your donation.<\/p><p>Have a great day,<br>- The Illuminate Nations Team</p>"
}, "test", function() {
    //console.log("done");
});*/
