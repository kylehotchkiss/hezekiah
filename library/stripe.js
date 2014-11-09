//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var stripe = require("stripe")( process.env.HEZ_STRIPE_API );
var database = require("./database.js");

//
// Idea: direct fundrasing platform for missionaries
// We'd need to track all campaigns and check against a list of users to see if
// a match is found. If everything checks out, initiate the transfer immediately.
// Otherwise, leave funds alone for stripe to transfer all by itself.
//


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
var createCustomer = function( donation, callback ) {
    stripe.customers.create({
        description: donation.name,
        email: donation.email,
        card: donation.token
    }, function( error, customer ) {
        if ( error ) {
            callback( error, false );
        } else {
            var donor = {
                active: true,
                name: donation.name,
                email: donation.email,
                customerID: customer.id,
                addressCity: req.body.addressCity,
                addressState: req.body.addressState,
                addressPostal: req.body.addressPostal,
                addressStreet: req.body.addressStreet,
                addressCountry: req.body.addressCountry
            };

            database.DonorModel.findOneAndUpdate({ "email": donation.email }, donor,
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
        card: donation.token
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
            createCustomer( donation, function( error, donorID ) {
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

                        createCustomer( donation, function( error, donorID ) {
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


//
// Check to see if same donation was made by email (while checking campaign and
// amount) within the past 5 minutes.
//
var dedupDonation = function( donation, callback ) {
    var fiveMin = new Date().getTime() - 300000;
    fiveMin = new Date( fiveMin );

    var params = {
        email: donation.email,
        amount: donation.amount,
        campaign: donation.campaign,
        date: { "$gte": fiveMin }
    };

    database.DonationModel.count(params, function( error, count ) {
        if ( error ) {
            callback( error, false );
        } else {
            callback( false, !!count );
        }
    });
};


exports.single = function( donation, callback ) {
    dedupDonation( donation, function( error, duplicate ) {
        if ( error ) {
            callback( error, false );
        } else if ( duplicate ) {
            callback( { slug: "duplicate", message: "You made this donation within the past five minutes. <br /> Please wait a few minutes to try again." }, false );
        } else {
            // Fix floating point math issues with Javascript.
            // CRIES A LITTLE CRIES A LOT.
            var amount = ( donation.amount * 100 ).toFixed(2);

            stripe.charges.create({
                card: donation.token,
                currency: "usd",
                amount: amount,
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
                callback( { slug: "duplicate", message: "You already make monthly donations to this cause." }, false );
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
                                name: donation.name,
                                email: donation.email,
                                postal: donation.addressPostal,
                                campaign: donation.campaign,
                                campaignName: donation.campaignName
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


exports.retrieve = function( email, postal, callback ) {
    retrieveCustomer( email, postal, function( error, donorID ) {
        if ( error ) {
            callback( error, false );
        } else {
            if ( !donorID ) {
                callback( false, 0 );
            } else {
                retrieveSubscriptions( donorID, function( error, subscriptions ) {
                    if ( error ) {
                        callback( error, false );
                    } else {
                        callback( false, subscriptions.data.length );
                    }
                });
            }
        }
    });
};


exports.cancel = function( email, postal, callback ) {
    retrieveCustomer( email, postal, function( error, donorID ) {
        if ( error ) {
            callback( error, false );
        } else {
            retrieveSubscriptions( donorID, function( error, subscriptions ) {
                if ( error ) {
                    callback( error, false );
                } else if ( !subscriptions.data ) {
                    callback( false, 0 );
                } else {
                    var subscriptionsIDs = [];

                    // Put all the Subscription IDs in an iterable array.
                    for ( var i in subscriptions.data ) {
                        var subscription = subscriptions.data[i];

                        subscriptionsIDs.push( subscription.id );
                    }

                    // Async Loop to unsub from all Subscriptions
                    var j = 0;

                    var unsubscribe = (function unsubscribe() {
                        if ( j < subscriptionsIDs.length ) {
                            var id = subscriptionsIDs[j];

                            j++;

                            stripe.customers.cancelSubscription( donorID, id, function( error, subscription ) {
                                if ( error ) {
                                    callback( false, false );
                                } else {
                                    unsubscribe();
                                }
                            });
                        } else {
                            // Finished

                            database.DonorModel.findOneAndUpdate({ customerID: donorID}, { active: false }, function( error ) {
                                callback( false, j );
                            });
                        }
                    })();
                }
            });
        }
    });
};
