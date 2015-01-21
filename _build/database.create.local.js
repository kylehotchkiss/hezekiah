require('node-env-file')(__dirname + '/../.env');

var database = require('../models');

database.sequelize.sync({ force:true });
