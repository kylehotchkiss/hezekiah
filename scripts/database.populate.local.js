require("node-env-file")(__dirname + "/../.env");

var moment = require("moment");
var database = require("../models");
var fixtures = require("sequelize-fixtures");

var opts = {
    transformFixtureDataFn: function( data ) {
        var hours = ( Math.random() * 1000 ).toFixed(0);
        var now = moment().subtract( hours, "hours" ).format();

        data.createdAt = now;
        data.updatedAt = now;

        if ( data.addressPostal ) {
            data.addressPostal = String( data.addressPostal );
        }

        return data;
    }
}

fixtures.loadFile("fixtures/donor.json", database, opts, function( error ) {
    fixtures.loadFile("fixtures/donation.json", database, opts, function( error ) {
        console.log("Imported Data");
    });
});
