//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//
// TODO: Validation?
//

var stripe = require("stripe")( process.env.DS_STRIPE_API );


exports.process = function( donation, campaign, callback ) {
    var charge = stripe.charges.create({
        card: donation.token,
        currency: "usd",
        amount: donation.amount * 100,
        description: "Donation" + (campaign.name ? (" for " + campaign.name) : ""),
        metadata: {
            ip: donation.ip,
            campaign:  campaign.slug,
            email: donation.email
        }
    }, function( error, charge ) {
        if ( error ) {
            callback( error, false );
        } else {
            callback( false, charge );
        }
    });
};


exports.retrieve = function( callback ) {

};


exports.create = function( callback ) {

};


exports.update = function( ) {

}
