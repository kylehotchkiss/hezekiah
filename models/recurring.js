/* email -> Donor.email
campaign -> Campaign.slug
subcampaign -> Subcampaign.slug
description -> idk??
amount -> float
stripeID -> String Stripe.SubID UNIQURE
metadata type.JSONB */


//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

module.exports = function( sequelize, type ) {
    var Recurring = sequelize.define('Recurring', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        email: { type: type.STRING, references: { model: 'Donors', key: 'email' } }, // pk
        amount: { type: type.INTEGER, allowNull: false },
        campaign: { type: type.STRING, references: { model: 'Campaigns', key: 'slug' } }, // pk
        subcampaign: { type: type.STRING, references: { model: 'Subcampaigns', key: 'slug' } }, // pk

        description: { type: type.STRING },

        active: { type: type.BOOLEAN, default: true },

        stripeID: { type: type.STRING, unique: true },

        metadata: { type: type.JSONB }
    }, {
        classMethods: {
            associate: function( models ) {
                Recurring.belongsTo( models.Donor, { foreignKey: 'email' } );
                Recurring.belongsTo( models.Campaign, { foreignKey: 'campaign' } );
                Recurring.belongsTo( models.Subcampaign, { foreignKey: 'subcampaign' } );
            }
        }
    });

    return Recurring;
};
