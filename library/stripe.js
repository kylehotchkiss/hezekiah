//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var stripe = require("stripe")( process.env.HEZ_STRIPE_API );
var database = require("../models");
var siftscience = require("./siftscience.js");

//
// Idea: direct fundrasing platform for missionaries
// We'd need to track all campaigns and check against a list of users to see if
// a match is found. If everything checks out, initiate the transfer immediately.
// Otherwise, leave funds alone for stripe to transfer all by itself.
//

// Create a processDonor function that replaces processCustomer
// always check/create donor
// check/create customer if donation is recurring
// return donorID


// Retrieve or Create a Donor
var retrieveDonor = function( donor, callback ) {
    database.Donor.findOrCreate( { where: { email: donor.email }, defaults: donor } ).then(function( donorObj ) {
        if ( donorObj === null ) {
            callback( false, false );
        } else {
            callback( false, donorObj[0] );
        }
    }, function( error ) {
        callback( error, false );
    });
};


// Grab ID for Stripe Customer given an email address
var retrieveCustomer = function( email, postal, callback ) {
    var params = { "email": email };

    if ( typeof postal === "function" ) {
        callback = postal;
    } else {
        params.addressPostal = postal;
    }

    database.Donor.find({ where: params }).then(function( donor ) {
        if ( donor === null ) {
            callback( false, false );
        } else {
            callback( false, donor.customerID);
        }
    }, function( error ) {
        callback( error, false );
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
                subscriber: true,
                lastAction: Date.now(),
                customerID: customer.id
            };

            database.Donor.find({ where: { email: donation.email }}).then(function( donorObj ) {
                if ( donorObj === null ) {
                    database.Donor.create( donor ).then(function() {
                        callback( false, customer.id );
                    }, function( error ) {
                        callback( error, false );
                    });
                } else {
                    donorObj.updateAttributes( donor ).then(function() {
                        callback( false, customer.id );
                    }, function( error ) {
                        callback( error, false );
                    });
                }
            }, function( error ) {
                callback( error, false );
            });
        }
    });
};


var updateCustomer = function( donation, donorID, callback ) {
    stripe.customers.update(donorID, {
        card: donation.token
    }, function( error, customer ) {
        if ( error ) {
            callback( error );
        } else {
            database.donor.find({ where: { customerID: donorID }}).then(function( donorObj ) {
                donorObj.updateAttributes({ subscriber: true }).then(function() {
                    callback( false );
                }, function( error ) {
                    callback( error );
                });
            }, function( error ) {
                callback( error );
            });
        }
    });
};


// Takes care of processing for our Donor-Customer interface
var processDonor = function( donation, callback ) {
    retrieveDonor( donation, function( error, donor ) {
        if ( error || !donor ) {
            callback( true, false );
        } else {
            if ( donation.recurring ) {
                if ( !donor.customerID ) {
                    createCustomer( donation, function( error, customerID ) {
                        if ( error ) {
                            callback( error, false );
                        } else {
                            callback( false, donor.id, customerID );
                        }
                    });
                } else {
                    updateCustomer( donation, donor.id, function( error ) {
                        if ( error ) {
                            if ( error.type === "StripeInvalidRequest" ) {
                                // Stripe Customer has been deleted, create new one.
                                // Also, flag this. Huge data management issue.

                                createCustomer( donation, function( error, customerID ) {
                                    if ( error ) {
                                        callback( error, false );
                                    } else {
                                        callback( false, donor.id, customerID );
                                    }
                                });
                            } else {
                                callback( error, false );
                            }
                        } else {
                            callback( false, donor.id, customerID );
                        }
                    });
                }
            } else {
                callback( false, donor.id );
            }
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
    if ( donorID ) {
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
    } else {
        callback( false, false );
    }
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
        createdAt: { gte: fiveMin }
    };

    database.Donation.count({ where: params }).then( function( count ) {
        callback( false, !!count );
    }, function( error ) {
        callback( error, false );
    });
};


exports.single = function( donation, callback ) {
    processDonor( donation, function( error, donor ) {
        donation.DonorId = donor;

        dedupDonation( donation, function( error, duplicate ) {
            if ( error ) {
                callback( error, false );
            } else if ( duplicate ) {
                callback( { slug: "duplicate", message: "You made this donation within the past five minutes. <br /> Please wait a few minutes to try again." }, false );
            } else {
                // Fix floating point math issues with Javascript.
                // CRIES A LITTLE CRIES A LOT.

                stripe.charges.create({
                    card: donation.token,
                    currency: "usd",
                    amount: donation.amount,
                    description: "Donation" + (donation.description ? (" for " + donation.description) : ""),
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

                    siftscience.report( donation, charge );
                });
            }
        });
    });
};


exports.monthly = function( donation, callback ) {
    processDonor(donation, function( error, donorID, customerID ) {
        donation.DonorId = donorID;

        dedupSubscription( donation, customerID, function( error, duplicate ) {
            if ( error ) {
                callback( error, false );
            } else if ( duplicate ) {
                callback( { slug: "duplicate", message: "You already make monthly donations to this cause." }, false );
            } else {
                verifyPlan(function( error ) {
                    if ( error ) {
                        callback( error, false );
                    } else {
                        stripe.customers.createSubscription(customerID, {
                            plan: "one",
                            quantity: Math.floor( donation.amount / 100 ),
                            metadata: {
                                ip: donation.ip,
                                email: donation.email,
                                campaign: donation.campaign,
                                description: donation.description,
                                subcampaign: donation.subcampaign                                
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

                            database.Donor.find({ where: { customerID: donorID }}).then(function( donorObj ) {
                                donorObj.updateAttributes({ subscriber: false }).then(function() {
                                    callback( false, j );
                                }, function( error ) {
                                    callback( error, j );
                                });
                            }, function( error ) {
                                callback( error, j );
                            });
                        }
                    })();
                }
            });
        }
    });
};
