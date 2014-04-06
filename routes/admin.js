//
// Illuminate Nations - DonateServ v.1
// Copyright 2013 Illuminate Nations
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

module.exports = function() {
	var express = require('express');
  	var app = express();

  	var loggedIn = function(req, res, next) {
	    if ( Parse.User.current() ) {
	        next();
	    } else {
	        res.redirect("/admin/");
	    }
	}

	// 
	// Access Policy
	//
	app.all('/reports', loggedIn);
	app.all('/campaigns', loggedIn);

  	//
  	// Login / Logout
  	//
  	app.get('/', function( req, res ) {
	    if ( Parse.User.current() ) {
	        // template admin.ejs

			var donationsQuery = new Parse.Query("donations");

			donationsQuery.find({
  				success: function( donations ) {
    				res.render("admin/index", { donationsString: JSON.stringify( donations ), user: Parse.User, path: '/' });
  				},
  				error: function( error ) {
    				res.send( error );
  				}
			});
	    } else {
	        // template login.ejs / welcome.ejs
	        res.render("admin/login");
	    }
	});

	app.post('/login', function(req, res) {
	    var username = req.body.username;
	    var password = req.body.password;

	    Parse.User.logIn(username, password).then(function( user ) {
	        res.redirect('/admin/');  
	    }, function( error ) {
	        res.render("error", { error: error });
	    });
	});
	 
	app.get('/logout', function(req, res) {
	    Parse.User.logOut();

	    res.redirect('/admin');
	});


	// 
	// Campaign Reporting and Management
	//
	app.get('/campaigns', function(req, res) {
		// Campaigns Index + aggreate report

		var campaignsQuery = new Parse.Query("campaigns");
		
		campaignsQuery.find({
  			success: function( campaigns ) {
    			res.render("admin/index_campaigns", { user: Parse.User, campaigns: campaigns });
  			},
  			error: function( error ) {
    			res.render("error", { error: error });
  			}
		});
	});

	app.get('/campaigns/create', function(req, res) {
		// Create Campaign VIEW

		res.render("admin/create_campaign", { user: Parse.User });
	});

	app.post('/campaigns/create', function(req, res) {
		// Create Campaign ACTION

		//req.body.
	})

	app.get('/campaigns/:campaign', function(req, res) {
		// View Campaign VIEW

		var campaign = req.param("campaign");

		var campaignsQuery = new Parse.Query("campaigns");
		var donationsQuery = new Parse.Query("donations");

		campaignsQuery.equalTo("slug", campaign);
		donationsQuery.equalTo("cause", campaign);

		campaignsQuery.find({
			success: function( campaigns ) {
				donationsQuery.find({
  					success: function( donations ) {
    					res.render("admin/single_campaign", { user: Parse.User, donations: donations, campaigns: campaigns });
  					},
  					error: function( error ) {
    					res.render("error", { error: error });
  					}
				});
			},
 			error: function( error ) {
    			res.render("error", { error: error });
  			}			
		})
	});

	app.get('/campaigns/:campaign/edit', function(req, res) {
		// Campaign Edit VIEW

		var campaign = req.param("campaign");

		var campaignsQuery = new Parse.Query("campaigns");
		campaignsQuery.equalTo("slug", campaign);

		campaignsQuery.find({
			success: function( campaign ) {
  				res.render("admin/create_campaign", { user: Parse.User, campaign: campaign });
			},
 			error: function( error ) {
    			res.render("error", { error: error });
  			}			
		})
	});

	app.post('/campaigns/:campaign/edit', function(req, res) {
		// Edit Campaign ACTION

		var campaign = req.param("campaign");
	});	

	app.get('/campaigns/:campaign/archive', function(req, res) {
		// Archive campaign ACTION
	});


	//
	// Reporting
	//
	app.get('/reports', function(req, res) {
		// Reports index VIEW
		res.render("admin/index_reports", { user: Parse.User });
	});

	app.get('/reports/search', function(req, res) {
		// Check for q string VIEW

		null;
	});


	return app;
}();