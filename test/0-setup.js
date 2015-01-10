//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

// Localhost Testing
require("node-env-file")(__dirname + "/../.env.testing");

var should = require("should");
var request = require("request");
var database = require("../models");

describe("Setup Tests", function() {
    it("successfully resets the database", function( done ) {
        database.sequelize.sync({ force:true });

        done();
    });

    it("successfully wakes up the testing server", function( done ) {
        request({
            url: prcoess.env.HEZEKIAH_TESTING_SERVER + "/health",
            json: true
        }, function( error, response, body ) {
            should( error ).not.be.ok

            done();
        });
    });
});
