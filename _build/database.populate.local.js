//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

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
        data.transactionFee = ((data.amount * 0.029) + 30).toFixed(0);

        if ( data.addressPostal ) {
            data.addressPostal = String( data.addressPostal );
        }

        return data;
    }
};

fixtures.loadFile("fixtures/donor.json", database, opts, function( error ) {
    fixtures.loadFile("fixtures/donation.json", database, opts, function( error ) {
        console.log("Imported Data");
    });
});
