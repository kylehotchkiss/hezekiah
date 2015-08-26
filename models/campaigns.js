//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

module.exports = function( sequelize, type ) {
    var Campaign = sequelize.define('Campaign', {
        id: { type: type.INTEGER, unique: true, autoIncrement: true },

        slug: { type: type.STRING, primaryKey: true, unique: true, allowNull: false },
        name: { type: type.STRING },
        mode: { type: type.ENUM, values: ['flexible', 'designated', 'sponsorship', 'ticketed'], allowNull: false, defaultValue: 'flexible' },

        direct: { type: type.STRING, unique: true }, // Unused
        expose: { type: type.BOOLEAN, defaultValue: false },

        metadata: { type: type.JSONB }
    }, {
        classMethods: {
            associate: function( models ) {
                Campaign.hasMany( models.Donation, { foreignKey: 'campaign' } );
                Campaign.hasMany( models.Subcampaign, { foreignKey: 'campaign' } );
            }
        }
    });

    return Campaign;
};
