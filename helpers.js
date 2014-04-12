//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//


var mailchimpBase = "https://us7.api.mailchimp.com/2.0/";
var mandrillBase = "https://mandrillapp.com/api/1.0/";

//
// Includes
//
var stripe = require('stripe');
var mandrill = require('mandrill');
var config = require('./config.json');


//
// Inits
//
stripe.initialize( preferences.keys.stripeAPI );

var helpers = {
	sendEmail: function( donation, cause, callback ) {
  		var message = "";
  		message += "<p>Hello " + donation.name + ",</p>";
  		message += "<p>Thank you for your generous donation of $" + donation.amount + " to Illuminate Nations for " + cause.title + ". We appreciate your support and encouragement.</p>";
  		message += "<p>Please keep this email reciept as proof of your donation.</p>";
  		message += "<p>Have a great day, <br /> - The Illuminate Nations team.</p>";

		Parse.Cloud.httpRequest({
    		method: 'POST',
    		url: preferences.other.mandrillBase + "messages/send-template.json",
    		headers: { 'Content-Type': 'application/json' },
    		body: {
    			key: preferences.keys.mandrillAPI,
    			async: true,
    			inline_css: true,
	  			template_name: preferences.email.template,
	  			template_content: [{
	  				"name": "std_content00",
	  				"content": message
	  			}],
    			message: {
	    			subject: preferences.email.fromSubject,
	    			from_name: preferences.organization.name,
	    			from_email: preferences.email.fromEmail,
	    			to: [{
	        			email: donation.email,
	        			name: donation.name
	      			}]
	  			}
    		},
    		success: function( response ) {
    			callback( false, response );
  			},
  			error: function( response ) {
    			callback( true, response );
  			}
  		});
	},

	subscribeEmail: function( donation, callback ) {
		if ( donation.emailSignup && donation.mailchimpID ) {
			Parse.Cloud.httpRequest({
				method: "POST",
	  			url: preferences.other.mailchimpBase + "/lists/subscribe.json",
	  			headers: {
	    			'Content-Type': 'application/json'
	  			},
	  			body: {
			 		id: donation.mailchimpID,
			 		apikey: preferences.keys.mailchimpAPI,
			 		double_optin: false,
			 		email: {
			 			email: donation.email
			 		},
			 	},
	  			success: function( response ) {
	    			callback( false, response );
	  			},
	  			error: function( response ) {
	    			callback( true, response );
	  			}
			});
		} else {
			// No need to throw errors
			callback( false, false );
		}
	},

	processDonation: function( donation, cause, callback ) {
		//
		// Parse is really awful sometimes. The most we can find out about
		// a rejection is "Card Error" - really?? Stripe provides the exact
		// reason a card rejected. Come on guys.
		//
		Stripe.Charges.create({
			currency: "usd",
			card: donation.token,
  			amount: donation.amount * 100, // cents
  			statement_description: (cause.slug ? (" - " + cause.slug) : ""),
  			description: "Donation" + (cause.title ? (" for " + cause.title) : ""),
  			metadata: {
  				ip: donation.ip,
  				cause:  "(" + cause.slug + ") " + cause.title,
  				email: donation.email
  			},
		},{
  			success: function( response ) {
				callback( false, response );
  			},
  			error: function( response ) {
    			callback( true, response );
  			}
		});
	},

	recordDonation: function( donation, cause, callback ) {
		var Donations = Parse.Object.extend("donations");
        var donations = new Donations();

        donations.set("ip", donation.ip);
        donations.set("cause", cause.slug);
        donations.set("donor", donation.name);
        donations.set("email", donation.email);
        donations.set("amount", donation.amount);
        donations.set("method", "stripe");

        donations.save(null, {
            success: function( response ) {
            	callback( false, response );
            }, error: function( response ) {
				callback( true, response );
            }
        });

	}
};

module.exports = helpers;
