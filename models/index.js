//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

var fs = require("fs");
var path = require("path");
var environment = process.env.NODE_ENV || 'development';
var sequelize, Sequelize = require('sequelize');

var log = function( text ) {
    if ( environment === "development" ) {
        console.log( text );
    }
};


/* Try to load database or complain */
if ( process.env.DATABASE_URL ) {
    console.log( process.env.DATABASE_URL );

    var options = {
        logging: log
    };

    if ( process.env.NODE_ENV === "testing" ) {
        options.ssl = true;
        options.native = true;
    }

    sequelize = new Sequelize(process.env.DATABASE_URL, options);
} else {
    console.error("DATABASE_URL is not defined -- check that environment is properly set");

    process.exit();
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
