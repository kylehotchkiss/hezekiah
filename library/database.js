//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var mongoose = require("mongoose");
var validate = require("validator");

mongoose.connect( process.env.MONGO_URL );


//
// This is the schema for all indivdual donations. It keeps track of everything
// we need to legally track. However, it is most efficent to use these in
// combination with indivdual donors to grab lists of donations per donor.
//
var DonationSchema = mongoose.Schema({
    date: { type: Date, required: true, default: Date.now() },
    email: { type: String, required: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
    amount: { type: Number, required: true, min: 0 },
    stripeID: { type: String, required: true },
    campaign: { type: String, required: true },

    ip: { type: String },
    source: { type: String },
    subcampaign: { type: String },
    refunded: { type: Boolean, default: false },
    recurring: { type: Boolean, default: false }
});


//
// This are simple entites for indivdual donors, linking us with their prior
// donation history for reporting, simple donor counts, linking donations
// internally within Stripe, and allowing us to easily connect emails to Stripe
// customer IDs for future donations and recurring donation cancelations.
//
// Emails alone will be used to connect a new donation to a Customer. Email and
// postal shall be used to cancel a monthly donation.
//
var DonorSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    customerID: { type: String, required: true },

    addressCity: { type: String },
    addressState: { type: String },
    addressStreet: { type: String },
    addressPostal: { type: String },
    addressCountry: { type: String },

    subscriber: { type: Boolean, default: true },
    lastAction: { type: Date, required: true, default: Date.now() }
});

exports.DonationModel = mongoose.model("Donation", DonationSchema);
exports.DonorModel = mongoose.model("Donor", DonorSchema);
