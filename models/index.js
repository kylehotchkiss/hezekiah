//
// Illuminate Nations - DonateServ v.0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

if ( !global.hasOwnProperty('db') ) {
    var sequelize, Sequelize = require('sequelize');

    /* Try to load database or complain */
    if ( process.env.DATABASE_URL ) {
        var connection = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

        sequelize = new Sequelize(connection[5], connection[1], connection[2], {
            dialect: 'postgres',
            protocol: 'postgres',
            port: connection[4],
            host: connection[3],
            logging: false
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

    /* Models */
    global.db = {
        Sequelize: Sequelize,
        sequelize: sequelize,
        Campaign: sequelize.import(__dirname + '/campaign'),
        Donation: sequelize.import(__dirname + '/donation'),
        Subscriber: sequelize.import(__dirname + '/subscriber')
    }
}

module.exports = global.db;
