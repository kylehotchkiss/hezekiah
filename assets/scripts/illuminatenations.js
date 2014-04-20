var donateMagic = function() {
	if ( jQuery(".page-donate").length ) {
        var donationThanks = jQuery("input[name=donationThanks]").val();

		Stripe.setPublishableKey('pk_live_ROQ6Zz0qy2wm735V8NgP5kgm');

		jQuery('input#field-card-number').payment('formatCardNumber');
		jQuery('input#field-card-expires').payment('formatCardExpiry');
		jQuery('input#field-card-cvc').payment('formatCardCVC');

		jQuery(".amount input[type=radio]").change(function() {
			var amount = jQuery(".amount input[type=radio]:checked").val();

			jQuery(".data-amount").text("$" + amount);
		});

        jQuery(".level input[type=radio]").change(function() {
            var amount = jQuery(".level input[type=radio]:checked").data("amount");

            jQuery(".data-amount").text("$" + amount);
        });

        jQuery("#form-donate").parsley({
            animate: false,
            errorClass: "error",
            messages: {
                type: {
                    email: "Please enter a valid email address."
                },
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

        jQuery("#form-donate").submit(function( event ) {
            event.preventDefault();

            var $form = jQuery(this);

            if ( jQuery("#form-donate").parsley( 'isValid' ) ) {
                // Analytics Data
                var transactionID = new Date().getTime();
                var transactionSlug = jQuery("input[name=causeSlug]").val();
                var transactionTitle = jQuery("input[name=causeTitle]").val();
                var transactionAmount = jQuery("input[name=donationAmount]:checked").val();

                $form.find('input[type=submit]').prop('disabled', true).attr('value', 'Loading...');

                var expiration = jQuery.payment.cardExpiryVal( jQuery('input#field-card-expires').val() );

                Stripe.card.createToken({
                    cvc: $form.find("#field-card-cvc").val(),
                    name: $form.find("#field-name").val(),
                    number: $form.find("#field-card-number").val(),
                    exp_year: expiration.year,
                    exp_month: expiration.month
                }, function( status, response ) {
                    var $form = jQuery('#form-donate');

                    if ( response.error ) {
                        $form.find('.payment-errors').text( response.error.message );
                        $form.find('input[type=submit]').prop('disabled', false).attr('value', 'Donate');
                    } else {
                        var token = response.id;

                        $form.append($('<input type="hidden" name="donationToken" />').val(token));

                        jQuery.ajax({
                            url: $form.attr("action"),
                            method: $form.attr("method"),
                            data: $form.serialize(),
                            crossDomain: true,
                            success: function( data ) {
                                if ( data.status === "success" ) {
                                    // Redirect or inline TY.

                                    ga('ecommerce:addTransaction', {
                                        id: transactionID,
                                        affiliation: 'Illuminate Nations',
                                        revenue: parseFloat(transactionAmount),
                                        shipping: '0',
                                        tax: '0'
                                    });

                                    ga('ecommerce:addItem', {
                                        id: transactionID,
                                        sku: transactionSlug,
                                        name: transactionTitle,
                                        category: 'Donation', // Donation or Sponsorship
                                        price: parseFloat(transactionAmount), // Unit price.
                                        quantity: '1'
                                    });

                                    ga('ecommerce:send');

                                    if ( donationThanks ) {
                                        window.location.replace( donationThanks )
                                    } else {
                                        // What happens Here
                                    }
                                } else {
                                    var errorMessage = data.error.message;

                                    $form.find('.payment-errors').text( errorMessage );
                                    $form.find('input[type=submit]').attr('value', 'Donate');
                                }
                            },
                            error: function( xhr, error ) {
                                $form.find('.payment-errors').text("Your donation could not be processed at this time. <br /> Please try again later.");
                                $form.find('input[type=submit]').attr('value', 'Donate');
                            }
                        });
                    }
                });
            } else {
                $form.find('.payment-errors').text("Please correct the errors in red below.");
            }
        });

		jQuery('#form-donate').submit(function( event ) {

  		});
	}
}

var mobileNav = function() {
    jQuery(".toggle-nav a").click(function( event ) {
        event.preventDefault();

        jQuery(".mobile-navigation").addClass("open");

        jQuery(".mobile-navigation .close").one("click", function() {
            jQuery(".mobile-navigation").removeClass("open");
        });
    });
}

var lightboxes = function() {
    jQuery(".magnificify").magnificPopup({
        delegate: 'li a',
        type: 'image',
        gallery: { enabled: true }
    });
}

var rotatorMagic = function() {
    var setClass = function( incoming ) {
        var slide = jQuery(incoming).attr("id");

        // Remove all slide classes from body
        jQuery("body").removeClass(function(index, selector) {
            return ( selector.match(/\bcurrent-\S+/g) || [] ).join(' ');
        });

        // Add new slide-* class
        jQuery("body").addClass("current-" + slide);
    }

    jQuery('.home-rotator').on('cycle-update-view', function(event, options, slideOptions, incoming) {
        setClass(incoming);
    });

    jQuery('.home-rotator').on('cycle-after', function(event, options, outgoing, incoming, forward) {
        setClass(incoming);
    });
}

var menus = function() {
    jQuery("header .js-superfish").superfish({
        delay: 0,
        speed: 'fast',
        speedOut: 'fast',
    });
}

var prayerWall = function() {
    jQuery('.prayers').imagesLoaded(function() {
        jQuery('.prayers').masonry({
            columnWidth: 320,
            itemSelector: '.prayer'
        });
    });
}

jQuery(function() {
	donateMagic();
    mobileNav();
    lightboxes();
    rotatorMagic();
    menus();

    prayerWall();
});