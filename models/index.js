if ( !global.hasOwnProperty('db') ) {
    var sequelize, Sequelize = require('sequelize');
	
 
	if ( process.env.DATABASE_URL ) {
		var connection = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
 
		sequelize = new Sequelize(connection[5], connection[1], connection[2], {
			dialect: 'postgres',
			protocol: 'postgres',
			port: connection[4],
			host: connection[3],
			logging:  true
		});
	} else {        
		sequelize = new Sequelize("khotchkiss", "khotchkiss", "", {
			dialect: 'postgres',
			protocol: 'postgres',
			port: 5432,
			host: "localhost",
			logging: console.log
		});
	}

 
	global.db = {
		Sequelize: Sequelize,
		sequelize: sequelize,
		Campaign: sequelize.import(__dirname + '/campaign'),
        Donation: sequelize.import(__dirname + '/donation')
	}
 
	/*
		Associations can be defined here. E.g. like this:
		global.db.User.hasMany(global.db.SomethingElse)
	*/
}
 
module.exports = global.db;