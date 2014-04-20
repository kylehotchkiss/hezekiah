var donations;

//
// Functions in General
//
var parseDonations = function( stripe, square, cash, period ) {
	// much of this could be rewritten in underscore
	var timeAmount, timeUnits, timeFormat, chartData; 

	var now = moment();
	var labels = { stripe: [], square: [], cash: [] };
	var data = { stripe: [], square: [], cash: [] };

	var totalDonations = 0;
	var campaignData = {};

	if ( period === "week" ) {
		timeAmount = 7
		timeUnit = "days";
		timeFormat = "MMM D";
	} else if ( period === "month" ) {
		timeAmount = 4;
		timeUnit = "weeks";
		timeFormat = "D";
	} else if ( period === "year" ) {
		timeAmount = 12;
		timeUnit = "months";
		timeFormat = "MMM YYYY";
	}

	for ( var i = (timeAmount - 1); i >= 0; i-- ) {
		data.stripe[i] = 0;
		labels.stripe[i] = now.format(timeFormat);

		now.subtract(timeUnit, 1);
	}

	if ( stripe ) {
		var end = moment();
		var begin = moment().subtract(timeUnit, timeAmount);

		for ( var i in donations ) {	
			var donation = donations[i];
			var time = moment( donation.createdAt );

			if ( typeof campaignData[donation.cause] === "undefined" ) {
				campaignData[donation.cause] = 1;
			} else {
				campaignData[donation.cause] += 1;
			}

			if ( time.isAfter( begin ) ) {
				var index = ( timeAmount - 1 ) + time.diff(end, timeUnit); // Get index of array based on date offset

				data.stripe[index] += parseFloat( donation.amount );

				totalDonations++;
			}
		}
	}

	chartData = {
		labels: labels.stripe,
		datasets: [{
			fillColor: "rgba(0, 140, 221, 0.25)",
			strokeColor: "rgba(0, 140, 221, 1)",
			data: data.stripe
		}],
	};

	console.log(  _.invert(campaignData) ); // needs conversion to array then output

	metaData = {
		total: "$" + data.stripe.reduce(function(x, y) { return x + y; }, 0),
		donations: totalDonations,
		campaigns: _.toArray( _.invert(campaignData) )
	}

	return { chart: chartData, meta: metaData }
}


// 
// jQuery Functions
//
var indexCharts = function() {
	if ( jQuery(".page-index").length ) {
		var opt = {
			scaleSteps: 5,
			scaleOverride: true,
			scaleStartValue: 0,
			scaleStepWidth: 200 / 5
		};

		var weeklyData = parseDonations( donations, null, null, "week" );
		var monthlyData = parseDonations( donations, null, null, "month" );
		var annualData = parseDonations( donations, null, null, "year" );		


		var $weeklyChart = $("#donations-week").get(0).getContext("2d");
		var $monthlyChart = $("#donations-month").get(0).getContext("2d");
		var $annualChart = $("#donations-annual").get(0).getContext("2d");


		var week = new Chart( $weeklyChart ).Line( weeklyData.chart, opt );		
		var month = new Chart( $monthlyChart ).Line( monthlyData.chart, opt );		
		var annual = new Chart( $annualChart ).Line( annualData.chart, opt );		

		jQuery("#weekly-total").text(weeklyData.meta.total);
		jQuery("#weekly-donations").text(weeklyData.meta.donations);

		jQuery("#monthly-total").text(monthlyData.meta.total);
		jQuery("#monthly-donations").text(monthlyData.meta.donations);

		jQuery("#annual-total").text(annualData.meta.total);
		jQuery("#annual-donations").text(annualData.meta.donations);


		$('.tabs').each(function() {
  			var $active, $content, $links = $(this).find('a');

			$active = $( $links.filter('[href="' + location.hash + '"]')[0] || $links[0] );
			$active.parent().addClass('active');
			$content = $( $active.attr('href') );

			$links.not($active).each(function () {
				$($(this).attr('href')).hide();
			});

  			$(this).on('click', 'a', function( event ) {
  				event.preventDefault();

				$active.parent().removeClass('active');
				$content.hide();

			    $active = $(this);
			    $content = $( $(this).attr('href') );

			    $active.parent().addClass('active');
			    $content.show();
  			});
		});
	}
}

jQuery(function() {
	indexCharts();
});