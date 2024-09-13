(function ($) {
    "use strict";

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 40) {
            $('.navbar').addClass('sticky-top');
        } else {
            $('.navbar').removeClass('sticky-top');
        }
    });
    
    // Dropdown on mouse hover
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function () {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function () {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });


    // Product carousel
    $(".product-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        margin: 45,
        dots: false,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsive: {
            0:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:3
            },
            1200:{
                items:4
            }
        }
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 5000,
        items: 1,
        dots: true,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
    });

    const oidcConfig = {
        acr_values: 'mosip:idp:acr:generated-code mosip:idp:acr:biometrics mosip:idp:acr:static-code',
        authorizeUri: 'https://esignet.collab.mosip.net/authorize',
        claims_locales: 'en',
        client_id: 'i0Ip_Xq4PlpS8wrk0tjjsP_mtmCdp91QSt2CcaoeaVg',
        display: 'page',
        max_age: 21,
        nonce: 'ere973eieljznge2311',
        prompt: 'consent',
        redirect_uri: 'http://localhost:2000/farmerdashboard',
        scope: 'openid profile',
        state: 'eree2311',
        ui_locales: 'en',
        claims: {},
      };
      
      console.log("Button is working")
      
      window.SignInWithEsignetButton?.init({
        oidcConfig: oidcConfig,
        buttonConfig: {
          labelText: 'Sign in with e-Signet',
          shape: 'soft_edges',
          theme: 'filled_orange',
          type: 'standard',
          width:'220px'
        },
        signInElement: document.getElementById("sign-in-with-esignet"),
      });
    
})(jQuery);

