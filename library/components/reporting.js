var moment = require('moment');

module.exports = {
    chart: function( donations, initialCount ) {
        var count = initialCount || 0;
        var days = {};
        var chart = [];
        var first = parseInt( moment().format('YYYYMMDD') );

        // Break the donations out into their dates
        donations.map(function( donation, i ) {
            var key = parseInt( moment( donation.createdAt ).format('YYYYMMDD') );

            if ( key < first ) {
                first = key;

                if ( !initialCount ) {
                    count = moment().diff( moment( donation.createdAt ), 'days' );
                }
            }

            if ( typeof days[key] === 'undefined' ) {
                days[key] = [];
            }

            days[key].push( donation );
        });

        // Turn the dates object into an Array
        for ( var i = 0; i <= count; i++ ) {
            var key = moment( first, 'YYYYMMDD' ).add(i, 'days').format('YYYYMMDD');

            if ( typeof days[ key ] !== 'undefined' ) {
                var total = 0;

                for ( var j in days[ key ] ) {
                    total += days[ key ][ j ].amount;
                }

                chart.push( total );
            } else {
                chart.push( 0 );
            }
        }

        return chart;
    }
};
