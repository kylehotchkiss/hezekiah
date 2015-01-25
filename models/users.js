module.exports = function( sequelize, type ) {
    var User = sequelize.define('User', {
        id: { type: type.INTEGER, primaryKey: true, autoIncrement: true, unique: true },

        //username
        //password
        //firstname
        //lastname
        //role enum admin reports campaign
        //campaigns
    }, {
        classMethods: {
            associate: function( models ) { }
        }
    });

    return User;
};
