var database = require('../../models');

module.exports = {
    get: function( slug, callback ) {
        database.Campaign.find({ where: { slug: slug }}).then(function( campaignObj ) {
            if ( campaignObj === null ) {
                callback( true, false );
            } else {
                callback( false, campaignObj.dataValues );
            }
        });
    },

    getAll: function( callback ) {
        database.Campaign.findAll().then(function( campaigns ) {
            callback( false, campaigns );
        });
    },

    create: function( data, callback ) {

    },

    edit: function( slug, data, callback ) {
        database.Campaign.find({ where: { slug: slug }}).then(function( campaignObj ) {
            if ( campaignObj !== null ) {
                callback( true, false );
            } else {
                campaignObj.updateAttributes( data ).then(function() {
                    callback( false, campaignObj.dataValues );
                }, function( error ) {
                    callback( error, false );
                });
            }
        });
    },

    editTemplate: function( slug, template, callback ) {
        database.Campaign.find({ where: { slug: slug }}).then(function( campaignObj ) {
            if ( campaignObj !== null ) {
                callback( true, false );
            } else {
                var metadata = campaignObj.metadata;

                // First time
                if ( typeof metadata.emails === 'undefined' ) {
                    metadata.emails = {};
                }

                metadata.emails.donation = template;

                campaignObj.updateAttributes({ metadata: metadata }).then(function() {
                    callback( false, campaignObj.dataValues );
                }, function( error ) {
                    callback( error, false );
                });
            }
        });
    }
};
