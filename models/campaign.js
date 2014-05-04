//
// Illuminate Nations - DonateServ v0.2.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

module.exports = function( sequelize, type ) {
    return sequelize.define("Campaign", {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        slug: {
            type: type.STRING,
            unique: true,
            validate: {
                len: [1,15],
                isAlphanumeric: true
            },
            comment: "Campaign slug for DonateServ, Mailchimp, and website"
        },
        name: {
            type: type.STRING,
            comment: "Human-friendly campaign name"
        },
        goal: {
            type: type.FLOAT
        },
        image: {
            type: type.STRING,
            comment: "Image URL",
            validate: {
                isUrl: true
            }
        },
        emailSubject: {
            type: type.STRING
        },
        emailTemplate: {
            type: type.STRING(2048),
            validate: {
                contains: ["{name}", "{campaign}", "{amount}", "{date}"]
            }
        },
        archived: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    })
};
