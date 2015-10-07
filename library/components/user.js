var bcrypt = require("bcrypt");
var database = require('../../models');

module.exports = {
    hash: function( secret, callback ) {
        bcrypt.hash( secret, 10, function( error, hash ) {
            callback( error, hash );
        });
    },

    create: function( data, callback ) {
        var whitelist = {
            username: true,
            password: true,
            firstname: true,
            lastname: true,
            role: true
        };

        this.hash( data.password, function( error, hash ) {
            data.password = hash;

            database.User.create( data ).then(function( userObj ) {
                if ( typeof callback == "function" ) {
                    callback( false, userObj );
                }
            }, function( error ) {
                if ( typeof callback == "function" ) {
                    callback( true, false );
                }
            });
        });
    },

    modify: function( user, data, callback ) {
        var whitelist = {
            password: true,
            firstname: true,
            lastname: true,
            role: true
        };

        // Apply whitelist for security purposes
        this.hash( data.password, function( error, hash ) {
            data.password = hash;

            database.User.find({ where: { username: user }}).then(function( userObj ) {
                userObj.updateAttributes( data ).then(function() {
                    if ( typeof callback == "function" ) {
                        callback( false );
                    }
                }, function( error ) {
                    if ( typeof callback == "function" ) {
                        callback( true );
                    }
                });
            }, function( error ) {
                if ( typeof callback == "function" ) {
                    callback( true );
                }
            });
        });
    },

    list: function( callback ) {
        database.User.findAll().then(function( usersObj ) {
            callback( false, usersObj );
        }, function( error ) {
            callback( true, false );
        });
    },

    reset: function( email, callback ) {
        var resetHash = '';

        database.User.findById({ where: { email: email }}).then(function( userObj ) {
            if ( userObj === null ) {

            } else {
                userObj.updateAttributes({

                }).then(function() {
                    // UserObj wouldn't be updated here due to sqlize issue

                    callback( false, true );
                });
            }
        }, function( error ) {
            callback( error, false );
        });
    },

    // Login Middleware
    login: function( username, password, done ) {
        database.User.find({ where: { username: username }}).then(function( userObj ) {
            if ( userObj === null ) {
                done( null, false, { message: 'Invalid username' } );
            } else {
                bcrypt.compare( password, userObj.password, function( error, match ) {
                    if ( match ) {
                        done( false, userObj.dataValues );
                    } else {
                        done( null, false, { message: 'Invalid password' } );
                    }
                });
            }
        }, function( error ) {
            done( error, false );
        });
    },

    // Store just the User ID when they log in
    serialize: function( user, done ) {
        done( null, user.id );
    },

    // Grab user info from DB from every request
    unserialize: function( id, done ) {
        database.User.findById(id).then(function( user ) {
            if ( user !== null ) {
                done( false, user.dataValues );
            } else {
                done( false, false );
            }
        }, function( error ) {
            done( error, false );
        });
    },

    // Check the auth level string passed in via middleware
    auth: function( level ) {
        return function( req, res, next ) {
            if ( req.isAuthenticated() ) {
                var role = req.user.role;

                if ( level === 'admin' && role === 'admin' ) {
                    next();
                } else if ( level === 'campaigns' && ( role === 'admin' || role === 'campaigns' ) ) {
                    next();
                } else if ( level === 'reporting' && ( role === 'admin' || role === 'campaigns' || role === 'reporting' )) {
                    next();
                } else if ( !level ) {
                    next();
                } else {
                    res.render('errors/401.html');
                }
            } else {
                req.flash('error', 'You must be logged in to view that page');
                req.session.next = req.originalUrl;
                res.redirect( '/admin' );
            }
        };
    },
};
