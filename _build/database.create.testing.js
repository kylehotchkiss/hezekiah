//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

if ( process.env.NODE_ENV !== "testing" ) {
    require('node-env-file')(__dirname + '/../.env.testing');
}

var database = require('../models');

database.sequelize.sync({ force:true });
