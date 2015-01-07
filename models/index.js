//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var fs = require("fs");
var path = require("path");
var environment = process.env.NODE_ENV || 'development';
var sequelize, Sequelize = require('sequelize');

/* Try to load database or complain */

if ( process.env.DATABASE_URL ) {
    var connection = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    var options = {
        dialect: 'postgres',
        protocol: 'postgres',
        port: connection[4],
        host: connection[3],
        logging: console.log
    };

    sequelize = new Sequelize(connection[5], connection[1], connection[2], options);
} else {
    console.error("DATABASE_URL is not valid.");

    return 0;
}

// Setup Models and Associations
// https://github.com/sequelize/express-example/blob/master/models/index.js
var database = {};

fs.readdirSync( __dirname )
    .filter(function( file ) {
        return ( file.indexOf(".") !== 0 ) && ( file !== "index.js" );
    })
    .forEach(function( file ) {
        var model = sequelize["import"]( path.join(__dirname, file ));
        database[ model.name ] = model;
    });

Object.keys( database ).forEach(function( modelName ) {
    if ( "associate" in database[ modelName ] ) {
        database[ modelName ].associate( database );
    }
});

database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;
