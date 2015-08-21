var bcrypt = require("bcrypt");

module.exports =  {
    hash: function( secret, callback ) {
        bcrypt.hash( secret, 10, function( error, hash ) {
            callback( error, hash );
        });
    },

    create: function( data, callback ) {
        this.hash( data.password, function( error, hash ) {
            database.User.create( data ).then(function( userObj ) {
                callback( false, userObj );
            }, function( error ) {
                callback( true, false );
            });
        });
    },

    edit: function( id, data, callback ) {

    },

    // Login Middleware
    login: function( username, password, done ) {
        database.User.find({ where: { username: username }}, function( userObj ) {
            if ( userObj === null ) {
                done("Invalid username");
            } else {
                bcrypt.compare( userObj.password, password, function( error, match ) {
                    // Assume error is inprobable
                    if ( match ) {
                        done("Incorrect password");
                    } else {
                        done( false, userObj );
                    }
                });
            }
        }, function( error ) {
            done( error );
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
            console.log("Checking in");
            next();
        };
    },
};
