//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//
// TODO: Validation?
//

var stripe = require("stripe")( process.env.DS_STRIPE_API );


exports.process = function( donation, cause, callback ) {
    var charge = stripe.charges.create({
        card: donation.token,
        currency: "usd",
        amount: donation.amount * 100,
        description: "Donation" + (cause.title ? (" for " + cause.title) : ""),
        statement_description: (cause.slug ? (" - " + cause.slug) : ""),
        metadata: {
            ip: donation.ip,
            cause:  "(" + cause.slug + ") " + cause.title,
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


exports.subscribe = function( donation, cause, callback ) {
    var customer = stripe.customers.create({
        card: donation.token,
        plan: cause.plan,
        email: donation.email
    }, function( error, customer ) {
        if ( error ) {
            callback( error, false );
        } else {
            callback( false, customer );
        }
    });
};


exports.unsubscribe = function( customer, subscription, callback ) {
    stripe.customers.cancelSubscription(
        customer,
        subscription,
        function( error, confirmation ) {
            if ( error ) {
                callback( error, false );
            } else {
                callback( false, confirmation );
            }
        }
    );
};
