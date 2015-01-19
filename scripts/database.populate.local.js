require("node-env-file")(__dirname + "/../.env");

var moment = require("moment");
var database = require("../models");
var fixtures = require("sequelize-fixtures");

fixtures.loadFile("fixtures/*.json", database, {
    transformFixtureDataFn: function( data ) {
        var hours = ( Math.random() * 1000 ).toFixed(0);
        var now = moment().subtract( hours, "hours" ).format();

        data.createdAt = now;
        data.updatedAt = now;

        if ( data.addressPostal ) {
            data.addressPostal = String( data.addressPostal );
        }

        if ( data.DonorId ) {
            data.DonorId = String( data.DonorId );
        }

        return data;
    }
}, function( error ) {
    console.log("Imported Data");
});
