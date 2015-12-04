var _ = require('lodash');
var database = require('../../models');

// Backend-Only
module.exports = {
    /**
     * Create a new donation
     * @param {donation object} donation
     * @param {function} callback
     */
    create: function( donation, callback ) {
        var cloned = _.clone( donation );

        // TODO: Calculate Transaction Fees via global options
        if ( !cloned.transactionFee ) { // TODO: Stripe doesn't return fee, but it may change?
            cloned.transactionFee = (( cloned.amount * 0.029 ) + 30).toFixed(0);
        }

        database.Donation.create( cloned ).then(function( donationObj ) {
            donationObj.getDonor().then(function( donorObj ) {
                // Pass along Donor name
                var donation = donationObj.toJSON();
                donation.donor = donorObj.toJSON();

                callback( false, donation );
            });
        }, function( error ) {
            callback( error, false );
        });
    },

    /**
     * Set a donation status to "Refunded"
     * @param {integer} donationID
     * @param {function} callback
     */
    refund: function( donationID, callback ) {
        database.Donation.find({ where: { transactionID: donationID }}).then(function( donationObj ) {
            if ( donationObj === null ) {
                callback( true, false );
            } else {
                donationObj.updateAttributes({ refunded: true }).then(function( donationObj ) {
                    donationObj.getDonor().then(function( donorObj ) {
                        // Pass along Donor name
                        var donation = donationObj.toJSON();
                        donation.donor = donorObj.toJSON();

                        callback( false, donation );
                    });
                }, function( error ) {
                    callback( error, false );
                });
            }
        }, function( error ) {
            callback( error, false );
        });
    }
};
