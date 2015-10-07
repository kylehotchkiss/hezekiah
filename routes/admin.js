var moment = require('moment');
var numeral = require("numeral");

var menu = require('../data/menus.json');
var user = require('../library/components/user.js');
var database = require('../models');
var reporting = require('../library/components/reporting.js');

module.exports = {
    views: {
        index: function( req, res ) {
            if ( req.isAuthenticated() ) {
                if ( req.session.next ) {
                    var next = req.session.next;
                    req.session.next = null;

                    res.redirect( next );
                } else {
                    var date = moment().format('MMMM YYYY');

                    database.Donation.findAll({ where: { createdAt: { gte: moment().subtract(7, 'days').toDate() } }, order: '"createdAt" DESC' }).then(function( donations ) {
                        var amount = 0;
                        var donors = [];
                        var campaigns = [];

                        donations.map(function( donation, i ) {
                            if ( donors.indexOf( donation.email ) === -1 ) {
                                donors.push( donation.email );
                            }

                            if ( campaigns.indexOf( donation.campaign ) === -1 ) {
                                campaigns.push( donation.campaign );
                            }

                            amount += donation.amount;
                        });

                        amount /= 100;

                        res.render("dashboard.html", {
                            date: date,
                            amount: numeral( amount ).format("$0,0.00"),
                            donors: donors.length,
                            campaigns: campaigns.length,
                            donorChart: JSON.stringify( reporting.chart( donations, 7 ) ),
                        });


                    }, function( error ) {
                        console.log( error );

                        res.render('errors/500.html');
                    });
                }
            } else {
                var error = req.flash('error');

                if ( Array.isArray( error ) ) {
                    error = error[0];
                }

                res.render("login.html", { error: error });
            }
        },

        notfound: function( req, res ) {
            res.render("errors/404.html");
        },

        account: function( req, res ) {
            user.list(function( error, users ) {
                res.render("account/index.html", { users: users });
            });
        }
    },

    actions: {
        logout: function( req, res ) {
            req.logout();
            res.redirect('/admin');
        },

        userCreate: function( req, res ) {
            user.create(req.body, function( error, user ) {
                if ( error ) {
                    req.flash('failure', 'The user could not be created');
                } else {
                    req.flash('success', 'The user was successfully created');
                }

                res.redirect('/admin/account');
            });
        }
    },

    helpers: {
        middleware: function( req, res, next ) {
            if ( req.isAuthenticated() ) {
                var menus = [];
                var url = req.originalUrl;

                for ( var i in menu.items ) {
                    var item = menu.items[i];

                    var level = item.role;
                    var role = req.user.role;

                    if ( item.title.indexOf("%username") !== -1 ) {
                        item.title = item.title.replace("%username", req.user.firstname);
                    }

                    if ( level === 'admin' && role === 'admin' ) {
                        menus.push( item );
                    } else if ( level === 'campaigns' && ( role === 'admin' || role === 'campaigns' ) ) {
                        menus.push( item );
                    } else if ( level === 'reporting' && ( role === 'admin' || role === 'campaigns' || role === 'reporting' )) {
                        menus.push( item );
                    }
                }

                // Menus Stuff
                req.app.locals.menus = menus;
                req.app.locals.path = req.originalUrl;

                // Flash Stuff
                var success = req.flash('success');
                var failure = req.flash('failure');

                if ( Array.isArray(success) ) {
                    req.app.locals.success = success[0];
                }

                if ( Array.isArray(failure) ) {
                    req.app.locals.failure = failure[0];
                }

                next();
            } else {
                next();
            }
        }
    }
};

/*exports.views.login
exports.views.home
exports.views.account
exports.views.indexIntegrations
exports.views.editIntegration
exports.views.indexUsers
exports.views.editUser
exports.views.viewUser
exports.views.indexCampaigns
exports.views.editCampaign
exports.views.viewCampaign
exports.views.indexSubcampaigns
exports.views.editSubcampaign
exports.views.viewSubcampaign


exports.actions.login
exports.actions.logout
exports.actions.editUser
exports.actions.editCampaign
exports.actions.editSubcampaign
exports.actions.editAccount
exprorts.actions.editIntegration*/
