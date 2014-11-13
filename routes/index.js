//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var meta = require('../package.json');

var hook = require("./hook.js");
var donate = require("./donate.js");
var reporting = require("./reporting.js");

var express = require('express');

module.exports = function( app ) {
	// Hooks
	app.post('/hook/stripe', hook.dispatcher);
	app.get('/hook/backup', hook.backup);


	// Donation Processing
	app.get('/donate/retrieve', donate.retrieve);
	app.post('/donate/one', donate.one);
	app.post('/donate/monthly', donate.monthly);
	app.get('/donate/cancel', donate.cancel);

	// Reporting
	app.get('/reporting/monthly', reporting.monthly);
	//app.get('/donate/cancel', donate.cancel);
	//app.get('/donate/cancel', donate.cancel);
	//app.get('/donate/cancel', donate.cancel);

	// 404
	app.get("*", function( req, res ) {
		res.json(404, {
			status: "error",
			message: "Not Found",
			timestamp: new Date().getTime(),
			server: meta.name + " v" + meta.version,
		});
	});

	return app;
};
