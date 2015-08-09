//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

module.exports = function( sequelize, type ) {
    var User = sequelize.define('User', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        username: { type: type.STRING, allowNull: false, unique: true },
        password: { type: type.STRING, allowNull: false, },
        firstname: { type: type.STRING },
        lastname: { type: type.STRING },
        role: { type: type.ENUM, values: ['admin', 'campaigns', 'reporting'], allowNull: false, defaultValue: 'reporting' },
    }, {
        classMethods: {
            associate: function( models ) { }
        }
    });

    return User;
};
