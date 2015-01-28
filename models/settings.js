//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

module.exports = function( sequelize, type ) {
    var Setting = sequelize.define('Setting', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        key: { type: type.STRING, unique: true },
        value: { type: type.STRING }
    }, {
        classMethods: {
            associate: function( models ) { }
        }
    });

    return Setting;
};
