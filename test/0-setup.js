//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

// Localhost Testing
if ( process.env.NODE_ENV !== "testing" ) {
    require("node-env-file")(__dirname + "/../.env.testing");
}

var database = require("../models");

describe("Setup Tests", function() {
    it('successfully create the database structure', function( done ) {
        var database = require('../models');

        database.sequelize.sync({ force: true }).then(function() {
            done();
        }, function( error ) {
            done( error );
        });
    });
});
