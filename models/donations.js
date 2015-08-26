//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//
module.exports = function( sequelize, type ) {
    var Donation = sequelize.define('Donation', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        email: { type: type.STRING, allowNull: false, references: { model: 'Donors', key: 'email' } }, // pk
        amount: { type: type.INTEGER, allowNull: false },
        transactionFee: { type: type.INTEGER, allowNull: false },
        campaign: { type: type.STRING, allowNull: false, references: { model: 'Campaigns', key: 'slug' } }, // pk
        subcampaign: { type: type.STRING, references: { model: 'Subcampaigns', key: 'slug' } }, // pk

        description: { type: type.STRING, allowNull: false },

        source: { type: type.STRING },
        referrer: { type: type.STRING },

        refunded: { type: type.BOOLEAN, default: false },
        recurring: { type: type.BOOLEAN, default: false },

        ip: { type: type.STRING },
        transactionID: { type: type.STRING, unique: true },
        subscriptionID: { type: type.STRING },
        receiptID: { type: type.STRING },

        metadata: { type: type.JSONB }
    }, {
        classMethods: {
            associate: function( models ) {
                Donation.belongsTo( models.Donor, { as: "Donor", foreignKey: "email" } );
                Donation.belongsTo( models.Campaign, { foreignKey: "campaign" } );
                Donation.belongsTo( models.Subcampaign, { foreignKey: "subcampaign" } );
            }
        }
    });

    return Donation;
};
