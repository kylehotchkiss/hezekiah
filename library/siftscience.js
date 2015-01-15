var request = require("request");
var countries = require("../data/countries.json");

var API = "https://api.siftscience.com/v203/events";

var countryCode = function( value ) {
    var index = -1;

	for ( var i = 0; i < countries.length; i++ ) {
		if ( countries[i].n !== "" ) {
			if ( countries[i].n === value ) {
				index = i;

				break;
			}
		}
	}

	if ( index >= 0 ) {
		return countries[i].c;
	} else {
		return false;
	}
};

exports.report = function( donation, charge, callback ) {
    if ( process.env.HEZ_SIFTSCIENCE_API ) {
        var data = {
            "$type": "$transaction",
            "$currency_code": "USD",
            "$user_id": donation.email,
            "$amount": donation.amount * 1000000, // todo
            "$transaction_id": charge.id, // todo
            "$user_email": donation.email,
            "$session_id" : donation.session,
            "$api_key": process.env.HEZ_SIFTSCIENCE_API,
            "$transaction_status": charge.paid ? "$success" : "$failure", // todo
            "$billing_address": {
                "$name": donation.name,
                "$city": donation.addressCity,
                "$region": donation.addressState,
                "$zipcode": donation.addressPostal,
                "$address_1": donation.addressStreet,
                "$country": countryCode( donation.addressCountry ),
            },
            "$payment_method": {
                "$payment_gateway": "$stripe",
                "$payment_type": "$credit_card",
                "$card_last4": charge.card.last4,
                "$verification_status": charge.card.paid,
                "$avs_result_code": charge.card.address_line1_check && charge.card.address_zip_check
            }
        };

        request({
            url: API,
            json: true,
            body: data,
            method: "POST"
        }, function( error, response, body ) {
            if ( error || body.status !== 0 ) {
                if ( typeof callback === "function" ) {
                    callback( true );
                }
            } else {
                if ( typeof callback === "function" ) {
                    callback();
                }
            }
        });
    } else {
        if ( typeof callback === "function" ) {
            callback( true );
        }
    }
};

exports.screen = function() {

};
