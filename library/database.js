//
// Illuminate Nations - Hezekiah v.0.3.0
// Copyright 2013-2014 Illuminate Nations
// Released under the General Public Licence
// Maintained by Kyle Hotchkiss <kyle@illuminatenations.org>
//

var mongoose = require("mongoose");
var validate = require("validator");


mongoose.connect(process.env.MONGO_URL);


var DonationSchema = mongoose.Schema({
    /* Meta */
    id: {
        type: mongoose.Schema.Types.ObjectId
    },
    ip: {
        type: String,
        required: true,
        validator: function( val ) {
            return validate.isIP( val );
        }
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    source: {
        type: String,
        required: false,
        default: ""
    },
    refunded: {
        type: Boolean,
        default: false
    },
    recurring: {
        type: Boolean,
        default: false
    },

    /* Donation */
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    campaign: {
        type: String,
        required: true
    },
    donorName: {
        type: String,
        required: true
    },
    donorEmail: {
        type: String,
        required: true,
        validator: function( val ) {
            return validate.isEmail( val );
        }
    },
    donorPostal: {
        type: Number,
        required: true
    },
    subcampaign: {
        type: String,
        required: false
    },

    /* Donation Meta */
    stripeID: {
        type: String,
        required: true,
        validator: function( val ) {
            return ( validate.contains(val, "ch_") && validate.isLength(27) )
        }
    },
    customerID: {
        type: String,
        required: true,
        validator: function( val ) {
            return ( validate.contains(val, "cus_") && validate.isLength(18) )
        }
    }
    //quickbooksID: String
});

exports.DonationModel = mongoose.model("Donation", DonationSchema);
