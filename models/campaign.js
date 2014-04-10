module.exports = function( sequelize, type ) {
  return sequelize.define("Campaign", {
    	slug: type.STRING,
    	name: type.STRING,
    	goal: type.FLOAT
  })
}