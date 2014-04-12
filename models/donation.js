module.exports = function( sequelize, type ) {
    return sequelize.define("Donation", {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        amount: {
            type: type.FLOAT,
            validate: {
                min: 0
            }
        },
        campaign: {
            type: type.STRING,
            comment: "Campaign Slug"
        },
        subcampaign: {
            type: type.STRING,
            comment: "Purpose for Donation within Campaign"
        },
        donorName: {
            type: type.STRING
        },
        donorEmail: {
            type: type.STRING,
            validate: {
                isEmail: true
            }
        },
        donorIP: {
            type: type.STRING,
            validate: {
                isIP: true
            }
        },
        method: {
            type: type.STRING,
            comment: "Technical method of donation"
        },
        recurring: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        source: {
            type: type.STRING,
            comment: "Where donor came from, if available"
        }
    });
}
