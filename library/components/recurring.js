var database = require('../../models');

// Backend-Only
module.exports = {
    /**
     * Subscription post-donate creation callback
     * @param {string} subscriptionID
     * @param {donation object} donation
     * @param {function} callback
     */
    create: function( subscriptionID, donation, callback ) {
        donation.active = true;
        donation.stripeID = subscriptionID;

        database.Recurring.create( donation ).then(function( recurringObj ) {
            callback( false, recurringObj.toJSON() );
        }, function( error ) {
            callback( error, false );
        });
    },

    /**
     * Manually initiate subscription cancellation
     * @param {string} subscriptionID
     * @param {function} callback
     */
    cancel: function( subscriptionID, callback ) {

    },

    /**
     * Subscription post-cancel callback
     * @param {string} subscriptionID
     * @param {function} callback
     */
    cancelled: function( subscriptionID, callback ) {
        database.Recurring.find({ where: { stripeID: subscriptionID } }).then(function( recurringObj ) {
            if ( recurringObj === null ) {
                callback( false, false );
            } else {
                recurringObj.updateAttributes({ active: false }).then(function( recurringObj ) {
                    callback( false, recurringObj.toJSON() );
                }, function( error ) {
                    callback( error, false );
                });
            }
        }, function( error ) {
            callback( error, false );
        });
    }
};
