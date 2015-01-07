//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

module.exports = function( sequelize, type ) {
    var Donor = sequelize.define('Donor', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        name: { type: type.STRING },
        email: { type: type.STRING, unique: true },
        customerID: { type: type.STRING },

        addressCity: { type: type.STRING },
        addressState: { type: type.STRING },
        addressStreet: { type: type.STRING },
        addressPostal: { type: type.STRING },
        addressCountry: { type: type.STRING },

        subscriber: { type: type.BOOLEAN, defaultValue: false }
    }, {
        classMethods: {
            associate: function( models ) {
                Donor.hasMany( models.Donation );
            }
        }
    });

    return Donor;
};
