//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

// Localhost Testing
if ( process.env.NODE_ENV !== "testing" ) {
    require("node-env-file")(__dirname + "/../.env.testing");
}

var should = require("should");
var request = require("request");
var database = require("../models");

describe("Setup Tests", function() {
    it("successfully wakes up the testing server", function( done ) {
        request({
            url: process.env.HEZ_TESTING_SERVER + "/health",
            json: true
        }, function( error, response, body ) {
            should( error ).not.be.ok;

            // *Yawn*, our server is groggy when he first wakes up
            setTimeout(function() {
                done();
            }, 5000);
        });
    });
});
