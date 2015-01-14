if ( process.env.NODE_ENV !== "testing" ) {
    require('node-env-file')(__dirname + '/../.env.testing');
}

var database = require('../models');

database.sequelize.sync({ force:true });
