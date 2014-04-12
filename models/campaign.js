module.exports = function( sequelize, type ) {
  return sequelize.define("Campaign", {
    	slug: type.STRING,
    	name: type.STRING,
        plan: type.STRING,
    	goal: type.FLOAT

        // image (s3), emailtitle, emailcontent
  })
}
