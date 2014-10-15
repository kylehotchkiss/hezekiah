//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var stripe = require("stripe")( "sk_test_NNOEYfuSLvdLlZrd7jNFRIzg" || process.env.DS_STRIPE_API );
var database = require("./database.js");


// Grab ID for Stripe Customer given an email address
var retrieveCustomer = function( email, postal, callback ) {
    var match = false;
    var params = { "email": email };

    if ( typeof postal === "function" ) {
        callback = postal;
    } else {
        params.postal = postal;
    }

    database.DonorModel.findOne(params, 'customerID', function( error, donor ) {
        if ( error ) {
            callback( error, false );
        } else if ( donor === null ) {
            callback( false, false );
        } else {
            callback( false, donor.customerID);
        }
    });
};


// Creates a new Stripe Customer, updates local record if it exists
var createCustomer = function( email, name, postal, callback ) {
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
            callback( error, false );
        } else {
            var donor = {
                name: name,
                email: email,
                postal: postal,
                customerID: customer.id
            };

            database.DonorModel.findOneAndUpdate({ "email": email }, donor,
                { upsert: true }, function( error ) {

                if ( error ) {
                    callback( error, false );
                } else {
                    callback( false, customer.id );
                }
            });
        }
    });
};


// Even though we're using Customers, we always want to use the card they just
// provided. TODO: does this affect monthly processing if they use a new card?
var updateCustomer = function( donation, donorID, callback ) {
    stripe.customers.update(donorID, {
        card: {
            number: "4242424242424242",
            exp_year: "2015",
            exp_month: "02"
        }
    }, function( error, customer ) {
        if ( error ) {
            callback( error );
        } else {
            callback( false );
        }
    });
};


// Takes care of additional processing for our donor/Customer interface
var processCustomer = function( donation, callback ) {
    retrieveCustomer( donation.email, function( error, donorID ) {
        // Create Customer if not found, update if found.
        if ( error || donorID === false ) {
            createCustomer( donation.email, donation.name, donation.postal, function( error, donorID ) {
                if ( error ) {
                    callback( error, false );
                } else {
                    callback( false, donorID );
                }
            });
        } else {
            updateCustomer( donation, donorID, function( error ) {
                if ( error ) {
                    if ( error.type === "StripeInvalidRequest" ) {
                        // Stripe Customer has been deleted, create new one.
                        // Also, flag this. Huge data management issue.

                        createCustomer( donation.email, donation.name, donation.postal, function( error, donorID ) {
                            if ( error ) {
                                callback( error, false );
                            } else {
                                callback( false, donorID );
                            }
                        });
                    } else {
                        callback( error, false );
                    }
                } else {
                    callback( false, donorID );
                }
            });
        }
    });
};


// Verify the presense of a plan called "one" with a value of $1. Complain loudly
// if one does not exist. This would be quite the blunder.
var verifyPlan = function( callback ) {
    var params = {
        name: "One Dollar",
        amount: 100,
        currency: "usd",
        interval: "month",
        statement_description: "Monthly"
    };

    stripe.plans.retrieve("one", function( error, plan ) {
        if ( error ) {
            // THROW Plan was deleted!

            params.id = "one";

            stripe.plans.create(params, function( error, plan ) {
                if ( error ) {
                    callback( true );
                } else {
                    callback( false );
                }
            });

        } else {
            if ( plan.amount !== 100 || plan.interval !== "month" || plan.currency !== "usd" ) {
                // THROW Plan was modified!

                stripe.plans.update("one", params, function( error, plan ) {
                    if ( error ) {
                        callback( true );
                    } else {
                        callback( false );
                    }
                });
            } else {
                callback( false );
            }
        }
    });
};


//
// Grab all subscriptions. Throw a wake-Kyle-up pager if quantity of these
// exceeds set bounds.
//
var retrieveSubscriptions = function( donorID, callback ) {
    stripe.customers.listSubscriptions(donorID, { limit: 100 }, function( error, subscriptions ) {
        if ( error ) {
            callback( error, false );
        } else {
            if ( subscriptions.has_more ) {
                // Throw huge issue!
            }

            callback( false, subscriptions );
        }
    });
};


//
// Check to see if Customer has existing subscriptions to said campaign -
// Throw error if so (prevents theortical runaway card usage attacks)
//
var dedupSubscription = function( donation, donorID, callback ) {
    retrieveSubscriptions( donorID, function( error, subscriptions ) {
        if ( error ) {
            callback( error, false );
        } else {
            if ( subscriptions.data.length ) {
                var match = false;

                for ( var i in subscriptions.data ) {
                    var subscription = subscriptions.data[i];

                    if ( subscription.metadata.campaign === donation.campaign ) {
                        match = true;
                    }
                }

                callback( false, match );
            } else {
                callback( false, false );
            }
        }
    });
};


exports.single = function( donation, callback ) {
    processCustomer(donation, function( error, donorID ) {
        if ( error ) {
            callback( error, false );
        } else {
            stripe.charges.create({
                customer: donorID,
                currency: "usd",
                amount: donation.amount * 100,
                description: "Donation" + (donation.campaignName ? (" for " + donation.campaignName) : ""),
                metadata: {
                    ip: donation.ip,
                    campaign: donation.campaign,
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
    });
};


exports.monthly = function( donation, callback ) {
    processCustomer(donation, function( error, donorID ) {
        dedupSubscription( donation, donorID, function( error, duplicate ) {
            if ( error ) {
                callback( error, false );
            } else if ( duplicate ) {
                callback( "Duplicate Subscription", false );
            } else {
                verifyPlan(function( error ) {
                    if ( error ) {
                        callback( error, false );
                    } else {
                        stripe.customers.createSubscription(donorID, {
                            plan: "one",
                            quantity: Math.floor( donation.amount ),
                            metadata: {
                                ip: donation.ip,
                                campaign: donation.campaign,
                                email: donation.email
                            }
                        }, function( error, subscription ) {
                            if ( error ) {
                                callback( error, false );
                            } else {
                                callback( false, subscription );
                            }
                        });
                    }
                });
            }
        });
    });
};


exports.cancel = function( email, postal, callback ) {
    retrieveCustomer( email, postal, function( error, donorID ) {
        if ( error ) {

        } else {

        }
    });
};
