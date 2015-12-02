var database = require('../../models');

// Backend-Only
module.exports = {
    /**
     * Subscription post-donate creation callback
     * @param {string} subscription
     * @param {donation object} donation
     * @param {function} callback
     */
    create: function( subscription, donation, callback ) {
        donation.stripeID = subscriptionID;

        database.Recurring.create( donation ).then(function( subscriptionObj ) {
            if ( subscriptionObj === null ) {
                callback( false, false );
            } else {
                callback( false, subscriptionObj[0].toJSON() );
            }
        }, function( error ) {
            callback( error, false );
        });
    },

    /**
     * Manually initiate subscription cancellation
     * @param {string} subscription
     * @param {function} callback
     */
    cancel: function( subscription, callback ) {

    },

    /**
     * Subscription post-cancel callback
     * @param {string} subscription
     * @param {function} callback
     */
    cancelled: function( subscription, callback ) {
        database.Recurring.find({ where: { stripeID: subscription } }).then(function( recurringObj ) {
            if ( recurringObj === null ) {
                callback( false, false );
            } else {
                recurringObj.updateAttributes({ active: false }).then(function( recurringObj ) {
                    callback( false, recurringObj[0].toJSON() );
                }, function( error ) {
                    callback( error, false );
                });
            }
        }, function( error ) {
            callback( error, false );
        });
    }
};
