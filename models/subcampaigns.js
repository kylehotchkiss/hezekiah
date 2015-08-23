//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

module.exports = function( sequelize, type ) {
    var Subcampaign = sequelize.define('Subcampaign', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        slug: { type: type.STRING, allowNull: false, unique: true },
        name: { type: type.STRING },

        campaign: { type: type.STRING, references: { model: 'Campaigns', key: 'slug' } }
    }, {
        classMethods: {
            associate: function( models ) {
                Subcampaign.hasMany( models.Donation, { foreignKey: 'subcampaign' } );
                Subcampaign.belongsTo( models.Campaign, { foreignKey: 'campaign', allowNull: true } );
            }
        }
    });

    return Subcampaign;
};
