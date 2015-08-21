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

    edit: function( id, data, callback ) {

    },

    // Login Middleware
    login: function( username, password, done ) {
        database.User.find({ where: { username: username }}).then(function( userObj ) {
            if ( userObj === null ) {
                done( null, false, { message: 'Invalid username' } );
            } else {
                bcrypt.compare( password, userObj.password, function( error, match ) {
                    if ( match ) {
                        done( false, userObj, { message: 'Invalid password' } );
                    } else {
                        done( null, false );
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
        database.User.find({ where: { id: id }}).then(function( error, user ) {
            done( error, user );
        });
    },

    // Check the auth level string passed in via middleware
    auth: function( level ) {
        console.log( level );

        return function( req, res, next ) {
            if ( req.isAuthenticated() ) { // check those levels too
                next();
            } else {
                req.flash('error', 'You must be logged in to view that page');
                res.redirect('/admin');
            }
        };
    },
};
