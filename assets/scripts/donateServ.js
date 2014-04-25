var donations;

//
// Functions in General
//
// todo: remove stripe/square segration, use same code for all campaigns,
// but find way to isolate campaigns countdown for all view
//
//
var parseDonations = function( stripe, square, cash, period ) {
	// much of this could be rewritten in underscore
	var timeAmount, timeUnits, timeFormat, chartData, topCampaigns = [];

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

	if ( stripe ) { // dep
		var end = moment();
		var begin = moment().subtract(timeUnit, timeAmount);

		for ( var i in donations ) {
			var donation = donations[i];
			var time = moment( donation.createdAt );

			if ( typeof campaignData[donation.campaign] === "undefined" ) {
				campaignData[donation.campaign] = 1;
			} else {
				campaignData[donation.campaign] += 1;
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

    for ( var campaign in campaignData ) {
        var i = campaignData[campaign];

        topCampaigns[i] = campaign;
    }

	metaData = {
		total: "$" + data.stripe.reduce(function(x, y) { return x + y; }, 0),
		donations: totalDonations,
		campaigns: topCampaigns.reverse()
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

        var weeklyCampaigns = "<ol>";
        var monthlyCampaigns = "<ol>";
        var annualCampaigns = "<ol>";

        for ( var i in weeklyData.meta.campaigns ) {
            var campaign = weeklyData.meta.campaigns[i];

            if ( i < 3 ) {
                weeklyCampaigns += '<li><a href="/admin/campaigns/' + campaign + '/">' + campaign + '</a>';
            }
        }

        for ( var i in monthlyData.meta.campaigns ) {
            var campaign = monthlyData.meta.campaigns[i];

            if ( i < 3 ) {
                monthlyCampaigns += '<li><a href="/admin/campaigns/' + campaign + '/">' + campaign + '</a>';
            }
        }

        for ( var i in annualData.meta.campaigns ) {
            var campaign = annualData.meta.campaigns[i];

            if ( i < 3 ) {
                annualCampaigns += '<li><a href="/admin/campaigns/' + campaign + '/">' + campaign + '</a>';
            }
        }

        weeklyCampaigns += "</ol>";
        monthlyCampaigns += "</ol>";
        annualCampaigns += "</ol>";

		jQuery("#weekly-total").text(weeklyData.meta.total);
		jQuery("#weekly-donations").text(weeklyData.meta.donations);
        jQuery("#weekly-campaigns").html(weeklyCampaigns);

		jQuery("#monthly-total").text(monthlyData.meta.total);
		jQuery("#monthly-donations").text(monthlyData.meta.donations);
        jQuery("#monthly-campaigns").html(monthlyCampaigns);

		jQuery("#annual-total").text(annualData.meta.total);
		jQuery("#annual-donations").text(annualData.meta.donations);
        jQuery("#annual-campaigns").html(monthlyCampaigns);


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

var campaignValidation = function() {
    jQuery("#form-campaign #field-goal").payment('restrictNumeric');

    jQuery("#form-campaign").parsley({
        animate: false,
        errorClass: "error",
        messages: {
            cvc: "Please enter a valid CVC.",
            card: "Please enter a valid card number.",
            expires: "Please enter a valid expiration date."
        },
        errors: {
            errorElem: '<span></span>',
            errorsWrapper: '<span class="error"></span>',
            container: function( element ) {
                var $container = element.parent().find("label");

                return $container;
            },
        },
        validators: {
            card: function() {
                return {
                    validate: function( number ) {
                        return jQuery.payment.validateCardNumber( number );
                    },
                    priority: 32
                }
            },
            cvc: function() {
                return {
                    validate: function( cvc ) {
                        return jQuery.payment.validateCardCVC( cvc );
                    },
                    priority: 32
                }
            },
            expires: function() {
                return {
                    validate: function( date ) {
                        var expiration = jQuery.payment.cardExpiryVal( date );

                        if ( expiration.month === NaN || expiration.year == NaN ) {
                            return false;
                        } else {
                            return jQuery.payment.validateCardExpiry( expiration.month, expiration.year );
                        }
                    },
                    priority: 32
                }
            }
        }
    });
}

jQuery(function() {
	indexCharts();
    campaignValidation();
});
