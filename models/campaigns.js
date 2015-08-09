//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

module.exports = function( sequelize, type ) {
    var Campaign = sequelize.define('Campaign', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        direct: { type: type.STRING, unique: true }, // Unused
        slug: { type: type.STRING, allowNull: false, unique: true },
        name: { type: type.STRING },

        expose: { type: type.BOOLEAN, defaultValue: false },
        subcampaign: { type: type.ENUM, values: ['flexible', 'designated', 'sponsorship', 'ticketed'], allowNull: false, defaultValue: 'flexible' },
    }, {
        classMethods: {
            associate: function( models ) {
                Campaign.hasMany( models.Donation, { foreignKey: "campaign", foreignKeyConstraint: true } );
            }
        }
    });

    return Campaign;
};
