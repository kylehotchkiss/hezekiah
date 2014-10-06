//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var stripe = require("stripe")( process.env.DS_STRIPE_API );


var retrieve = function( email, callback ) {
    var match = false;

    console.log("retrieve")

    stripe.customers.list({ limit: 100 }, function( error, donors ) {
        if ( error ) {
            console.log( error );
        } else {
            if ( donors.count ) {
                for ( var i in donors.data ) {
                    var donor = donors.data[i];

                    if ( donor.email === email ) {
                        callback( donor.id );

                        break;
                    }
                }
            } else {
                callback( false )
            }
        }
    })
};


var create = function( email, name, callback ) {
    stripe.customers.create({
        description: name,
        email: email,
        card: {
            number: "4242424242424242",
            exp_year: "2015",
            exp_month: "02"
        }
    }, function( error, customer ) {
        if ( error ) {
            console.log( error )
        }

        callback( customer.id );
    });
};


var update = function( donation, donorID, callback ) {
    stripe.customers.update(donorID, {
        card: {
            number: "4242424242424242",
            exp_year: "2015",
            exp_month: "02"
        }
    }, function( error, customer ) {
        if ( error ) {
            console.log( error );
        } else {
            callback();
        }
    });
}


exports.process = function( donation, callback ) {
    console.log( donation );

    retrieve( donation.email, function( donorID ) {
        console.log( donorID )

        if ( donorID ) {
            update( donation, donorID, function() {
                charge( donation, donorID );
            });
        } else {
            create( donation.email, donation.name, function( donorID ) {
                charge( donation, donorID );
            })
        }
    });

    var charge = function( donation, donorID ) {
        stripe.charges.create({
            customer: donorID,
            currency: "usd",
            amount: donation.amount * 100,
            description: "Donation" + (donation.campaignName ? (" for " + donation.campaignName) : ""),
            metadata: {
                ip: donation.ip,
                campaign: donation.campaignSlug,
                email: donation.email
            }
        }, function( error, charge ) {
            if ( error ) {
                callback( error, false );
            } else {
                callback( false, charge );
            }
        });
    }
};
