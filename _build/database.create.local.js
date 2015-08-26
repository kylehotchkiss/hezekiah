//
// Hezekiah v.0.3.0
// Copyright 2013-2015 Kyle Hotchkiss
// All Rights Reserved
//

require('node-env-file')(__dirname + '/../.env');

console.log( process.env.DATABASE_URL );

var database = require('../models');

database.sequelize.sync({ force:true });
