//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

module.exports = function( sequelize, type ) {
    var Donation = sequelize.define('Donation', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },


        email: { type: type.STRING },
        amount: { type: type.DECIMAL },
        campaign: { type: type.STRING },
        description: { type: type.STRING },

        source: { type: type.STRING },
        subcampaign: { type: type.STRING },

        ip: { type: type.STRING },
        transactionID: { type: type.STRING, unique: true },
        subscriptionID: { type: type.STRING },
        receiptID: { type: type.STRING },
        refunded: { type: type.BOOLEAN, default: false },
        recurring: { type: type.BOOLEAN, default: false }
    }, {
        classMethods: {
            associate: function( models ) {
                Donation.belongsTo( models.Donor );
            }
        }
    });

    return Donation;
};
