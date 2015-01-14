require('with-env')();

var database = require('./models');

database.sequelize.sync({ force:true });
