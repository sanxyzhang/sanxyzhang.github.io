;(function($, window, document, undefined) {
	var $win = $(window);
	var $doc = $(document);
	var circles = [];
	var $grid = false;
	var ajaxLoading = false;

	$.fn.isOnScreen = function(){
		var viewport = {
			top : $win.scrollTop(),
			left : $win.scrollLeft()
		};
		viewport.right = viewport.left + $win.width();
		viewport.bottom = viewport.top + $win.height();

		var bounds = $(this).offset();
		bounds.right = bounds.left + $(this).outerWidth();
		bounds.bottom = bounds.top + $(this).outerHeight();

		return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));

	};
	/**
	 * Initialization of masonry
	 * @param  {Object} container The container that holds the elements
	 * @param  {Object} element   The item selector
	 	 */
	function masonryGrid(container, element) {
		if ( $(container).length ) {
			if ( $(container).find('img').length ) {
				$(container).imagesLoaded().progress( function() {
					$grid = $(container).masonry({
						itemSelector: element,
						columnWidth: element,
						percentPosition: true
					});

				});
			} else {
				$grid = $(container).masonry({
					itemSelector: element,
					columnWidth: element,
					percentPosition: true
				});
			}
		}
	}

	function initWall(container, masonryContainer, masonryElement) {
		if ( !$(container).length ) {
			return;
		};

		var $wallOuter = $(container);
		var $wall = $wallOuter.find(masonryContainer);

		$win.on('load resize', resizeContainer);

		function resizeContainer() {
			$wallOuter.width('auto').width(Math.ceil($wallOuter.width() / 3) * 3);
		};
		resizeContainer();

		masonryGrid($wall, masonryElement);
	};

	/**
	 * Show/Hide header on scroll up/down
	 */
	function headerFunctionality() {
		var didScroll;
		var lastScrollTop = 0;
		var delta = 5;
		var navbarHeight = $('.header').outerHeight();
		var introHeight = $('.intro, .article-single__intro').outerHeight();

		$win.scroll(function(event){
			didScroll = true;
		});

		setInterval(function() {
			if (didScroll) {
				hasScrolled();
				didScroll = false;
			}
		}, 250);

		/**
		 * Check direction of scroll and add class to header
		 */
		function hasScrolled() {
			if ( $win.width() > 1024 ) {
				var st = $(this).scrollTop();

				// Make sure they scroll more than delta
				if(Math.abs(lastScrollTop - st) <= delta)
					return;

				// If they scrolled down and are past the navbar, add class .nav-up.
				// This is necessary so you never see what is "behind" the navbar.
				if ( (st > lastScrollTop && st > navbarHeight && $win.scrollTop() > introHeight ) ){
					// Scroll Down
					$('.header').removeClass('up').addClass('down');
				} else {
					// Scroll Up
					if(st + $(window).height() < $(document).height()) {
						$('.header').removeClass('down').addClass('up');
					}
				}

				lastScrollTop = st;
			}
		}
	}

	/**
	 * Remove query string parameter
	 */

	function stripParams( params, sourceURL ) {
		var ret = sourceURL.split("?")[0];
		var param;
		var params_arr = [];
		var queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";

		if ( queryString !== "" ) {
			params_arr = queryString.split("&");
			for (var i = params_arr.length - 1; i >= 0; i -= 1) {
				param = params_arr[i].split("=")[0];

				if ( params.indexOf( param ) !== -1 ) {
					params_arr.splice(i, 1);
				}
			}

			ret = ret + "?" + params_arr.join("&");
		}
		return ret;
	}

	/**
	 * Strip query params from url
	 */
	function getCurrentPageURL() {
		return window.location.href.split("?")[0];
	}

	function modifySelectedCriteria() {
		var $filters = $( '.filters__content' );
		var template = wp.template( 'filters' );
		var templateData = [];
		var curName = $( this ).attr('name');

		$('.radio input:checked').each(function(){
			var name = $( this ).attr('name');
			var value = $( this ).prop('id');

			var text = $( this ).val();

			templateData.push( {
				name: text,
				key: value,
				isDisabled: $( this ).hasClass( 'disabled' ),
			} );
		});

		if ( templateData.length === 0 ) {
			$filters.removeClass( 'active' );
			return;
		}

		var html = template( { tags : templateData } );
		$filters.empty().html( html );
		$filters.addClass('active');
	}

	function getFiltersCriteria() {
		var data = {};

		$( '.radio input:checked' ).each( function() {
			var name = $( this ).attr( 'name' );
			var id   = $( this ).attr( 'id' );

			data[ name ] = id;
		} );

		return data;
	}

	/**
	 * Filter Ajax
	 */

	function loadFilteredData( data ) {
		var $ajaxContainer = $('.updates');

		var url = getCurrentPageURL();
		history.pushState( {}, '', getCurrentPageURL() );

		if ( ajaxLoading === false ) {
			$.ajax( window.location.href, {
				method: 'GET',
				data: data,
				beforeSend: function () {
					ajaxLoading = true;
					$ajaxContainer.addClass('ajax-loading');
				},
			})
			.done( function( response ) {
				ajaxLoading = false;
				$ajaxContainer.removeClass('ajax-loading');

				if ( ! jQuery.isEmptyObject( data ) ) {
					history.pushState( {}, '', this.url );
				}

				var $newContent = $( response ).find('.updates__list .update-holder');

				$('.updates__actions').replaceWith($(response).find('.updates__actions'));
				$('.section__loader').replaceWith($(response).find('.section__loader'));

				if ( $newContent.length === 0 ) {
					$('.updates__list').html('<h3>No results found.</h3>');
					return;
				}

				$('.updates__list').empty().append( $newContent );

				$('.updates__actions').replaceWith($(response).find('.updates__actions'));


				$grid.masonry()
					.append( $newContent )
					.masonry( 'appended', $newContent );

					performanceData($win.scrollTop());
			})
			.fail( function() {
				$ajaxContainer.html('<h3>Error has occurred please try again!</h3>');
				$ajaxContainer.removeClass('ajax-loading');
			});
		}
	}

	/**
	 * Load More Ajax
	 */
	function loadMore() {
		var $ajaxContainer = $('.updates');

		var currPage = $('.updates__btn').data('current-page');
		var maxPages = $('.updates__btn').data('max');
		var href = $('.updates__btn').attr('href');

		if ( ajaxLoading === false && currPage < maxPages ) {
			$.ajax({
				url: href,
				type: "GET",
				beforeSend: function () {
					ajaxLoading = true;
					$ajaxContainer.addClass('ajax-loading');
				},
				success: function (response) {
					ajaxLoading = false;
					$ajaxContainer.removeClass('ajax-loading');

					var newContent = $(response).find('.updates__list .update-holder');

					$(newContent).appendTo('.updates__list');

					$('.updates__actions').replaceWith($(response).find('.updates__actions'));
					$('.section__loader').replaceWith($(response).find('.section__loader'));

					$grid.masonry()
						.append( $(newContent) )
						.masonry( 'appended', $(newContent) );

						$grid.imagesLoaded().progress( function() {

							$grid.masonry('layout');
						})

						performanceData($win.scrollTop());
				},
				error: function () {
					$ajaxContainer.html('<h3>Error has occurred please try again!</h3>');
					$ajaxContainer.removeClass('ajax-loading');
				}
			});
		}
	}

	/**
	 * Parallax Effect
	 */
	function parallaxEffect() {
		var winT = $win.scrollTop();
		var winH = $win.height();

		if($('.paralax-element').length && $win.width() > 1024) {
			$('.paralax-element').each(function() {
				var $this = $(this);
				var thisO = $this.offset().top;

				var paralaxElement = Math.min(-(winT-thisO)/5, winH); // How much to translate the element

				$this.find('.paralax-element__content').css({
					'transform': 'translateY(' + paralaxElement + 'px)',
					'-webkit-transform': 'translateY(' + paralaxElement + 'px)',
					'-moz-transform': 'translateY(' + paralaxElement + 'px)'
				});
			});
		};
	}

	/**
	 * Check If element is in the viewport
	 * @param {Number} topPosition The scroll position
	 */
	function visibleElement(topPosition) {
		$('.circle').each(function() {
			var _this = this;
			var element = $(this);
			var number = element.data('number');

			winH = $win.height()/1.1

			for (var i = element.length - 1; i >= 0; i--) {
				var currentElementTop = element.eq(i).offset().top - winH,
					currentScrollTop = topPosition

				if ( topPosition > currentElementTop ) {

					circles.forEach(function(element){
						if(_this == element._container){
							element.animate(number/100);
						}
					});
				};
			};
		})
	};

	function performanceData(topPosition) {
		$('.js-animation').each(function() {
			var $element = $(this),
			winH = $win.height()/1.05

			if ($element.isOnScreen()){
				$element.addClass('animate')
			} else {
				for (var i = $element.length - 1; i >= 0; i--) {
					var currentElementTop = $element.eq(i).offset().top - winH,
						  currentScrollTop = topPosition

				  if ( topPosition > currentElementTop ) {
					$element.addClass('animate')
				  };
				};
			};
		})
	};

	/**
	 * Fullsize Background Video
	 */
	$.fn.responsiveVideo = function (options) {

		var resize_repsonsive_video = function() {

			var $player = $(this);

			var win_width = $win.width(),
				win_height = $win.height();


			var video_width = parseInt($player.data('video-width'));
			var video_height = parseInt($player.data('video-height'));
			var video_offset = parseInt($player.data('video-offset'));

			var img_dimensions_ratio = video_height / video_width;

			var offset =  video_offset / video_height;

			offsetWidth = win_width * offset;
			offsetHeight = win_height * offset;


			if ( win_height / win_width > img_dimensions_ratio ) {

				var player_width = win_height / img_dimensions_ratio,
					player_height = win_height;

				player_width += (player_width * offset);
				player_height += ( player_height * offset)

				$player.height(player_height).width(player_width);

			} else {

				var player_width = win_width,
					player_height = win_width * img_dimensions_ratio;

				player_width += (player_width * offset);
				player_height += (player_height * offset);

				$player.width(player_width).height(player_height);

			}

			$player.css({
				'left': (win_width - $player.width()) / 2,
				'top':  (win_height - $player.height() ) /2
			});

		}

		var videos = this;
		$(window).on('resize', function () {
			videos.each(resize_repsonsive_video);
		});

		return videos.each(resize_repsonsive_video);
	};

	$doc.on('click', '.btn-filters', function (event) {
		event.preventDefault();

		if ( $( this ).hasClass( 'disabled' ) ) {
			return;
		}

		var id = $(this).data( 'id' );
		var $option = $( '#' + id );

		$option.attr( 'checked', false );
		$option.trigger( 'change' );

		$(this).remove();
	});

	$doc.on('click', '.link-remove-filters', function (event) {
		event.preventDefault();

		$('.list-radios input:not(disabled)').attr( 'checked',false );
		$('.list-radios input').first().trigger( 'change' );
	});

	$doc.ready(function() {
		var isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0 || navigator.maxTouchPoints > 0;

		$('body').addClass(isTouchDevice ? 'touch' : 'no-touch');

		/**
		 * Progress Bar plugin initialization
		 */
		$('.circle').each(function() {
			var $this = $(this);
			var color = $this.data('color');

			var target_value = $this.data('number');
			var is_decimal = Math.round(target_value) != target_value;
			// var decimal_places = (target_value.split('.')[1] || []).length;


			var bar = new ProgressBar.Circle(this, {
				 strokeWidth: 3,
				 easing: 'easeInOut',
				 duration: 1500,
				 color: color,
				 trailColor: '#838383',
				 trailWidth: 3,
				 svgStyle: null,
				 step: function(state, circle) {
					if(is_decimal) {
						var value = Math.round(circle.value() * 1000)/10;
					}
					else {
						var value = Math.round(circle.value() * 100);
					}
					circle.setText(value);
				 }
			});

			circles.push( bar );

			var suffix = $this.data('symbol');

			$this.find('.progressbar-text').wrap('<div class="text-wrapper"></div>');

			if ( $this.attr('data-symbol') ) {
				$this.find('.text-wrapper').append('<strong>' + suffix + '</strong>');
			}
		});

		initWall('.updates', '.updates__list', '.updates .update-holder');
		initWall('.feeds-holder', '.feeds', '.feeds .feed');
		headerFunctionality();

		$('.intro .intro__video').responsiveVideo();
		$('.article-single .article-single__intro .article-single__video').responsiveVideo();

		/**
		 * Magnific PopUp Video
		 */
		$('.popup-youtube').on('click', function(event) {
			event.preventDefault();

			const video = $(this).attr('href');

			$.magnificPopup.open({
				mainClass: 'mfp-iframe-holder',
				items: {
					src: `<div class="mfp-iframe-scaler"><button title="Close (Esc)" type="button" class="mfp-close">×</button><iframe class="mfp-iframe" src="${video}" frameborder="0" allowfullscreen=""></iframe></div>`, // can be a HTML string, jQuery object, or CSS selector
					type: 'inline'
				}
			});
		});

		$('.gallery-slider .gallery')
		if ( $('.gallery-slider .gallery').length) {
			$('.gallery-slider .gallery').addClass('owl-carousel').owlCarousel({
				items: 1,
				mouseDrag: false,
				loop: true,
				dots: false,
				nav: false,
				autoplay: true,
				autoplayTimeout: 10000,
				smartSpeed: 400,
				autoHeight: true
			});
		}

		/**
		 * Burger Button Functionality
		 */
		$('.btn-menu').on('click', function (event) {
			event.preventDefault();

			$(this).toggleClass('active');
			$('body').toggleClass('active');
		});

		$('.btn-menu').on('mouseenter', function() {
			var $lines = $(this).find('.burger span');

			$lines.each(function(index, element) {
				setTimeout(function(){
					$(element).addClass('hovered');

					setTimeout(function() {
						$(element).removeClass('hovered');
					}, 180);
				}, index*50 + 100);
			});
		});

		$( '.page-template-work .search__field, .blog .search__field' ).on( 'keypress', function( e ) {
			if ( e.which === 13 ) {
				var filters = getFiltersCriteria();

				filters[ 'search' ] = this.value;

				loadFilteredData( filters );
			}
		} );

		// Filter Functionlities
		$('.filter-btn').on('click', function (event) {
			var $this = $(this);

			event.preventDefault();

			$this.parent().toggleClass('active').siblings().removeClass('active');
		});

		$('.filters .radio input:radio').on('change', function() {
			var $this = $(this);
			var filtersCriteria = getFiltersCriteria();

			modifySelectedCriteria();
			loadFilteredData( filtersCriteria );

			$this.parents('.filter').removeClass('active');
		});

		/**
		 * Search Functionality
		 */
		$('.search__btn').on('click', function (event) {
			event.preventDefault();

			$(this).parent().toggleClass('active');
		});

		/**
		 * Scroll to functionality
		 */
		$('.js-scroll-to').on('click', function(e) {
			e.preventDefault();
			$('html, body').animate({ scrollTop: $($(this).attr('href')).offset().top}, 500, 'linear');
		});

		/**
		 * Navigation Functionality
		 */
		// $('.nav .menu-item-has-children > a').on('click', function (event) {
		// 	var $this = $(this);

		// 	if ( $win.width() < 768 ) {
		// 		if ( !$this.parent().hasClass('expanded') ) {
		// 			event.preventDefault();

		// 			$(this).siblings('ul').slideDown().parent().addClass('expanded').siblings().removeClass('expanded').find('ul').slideUp();
		// 		}
		// 	}
		// });

		$('.nav-secondary a').on('click', function(event) {
			if ($(this).siblings('ul').length ) {
				if( $win.width() < 1025 ) {
					if(!$(this).parent().hasClass('expanded')) {
						event.preventDefault();
					}
				}
				$(this).parent().addClass('expanded').siblings().removeClass('expanded');
			}
		});


		// Close element on click outside of it
		$doc.on('click touchstart', function(event) {
			var $target = $(event.target);

			if ( !$target.hasClass('navigation-holder') && !$target.parents('.navigation-holder').length && !$target.hasClass('btn-menu') && !$target.parents('.btn-menu').length) {

				$('body, .btn-menu').removeClass('active');
			};

			if ( !$target.hasClass('filter') && !$target.parents('.filter').length) {

				$('.filter').removeClass('active');
			};
		});

	$win.on('load', function(){

		$('body').addClass('loaded');


		var skip_hero_pages = [
			// function() { return $('body.term-case-study').length > 0; },
			// function() { return $('body.term-client-work').length > 0; },
			function() { return window.location.search.indexOf('industry=') >= 0; },
			function() { return window.location.search.indexOf('platform=') >= 0; },
			function() { return window.location.search.indexOf('media-type=') >= 0; },
			function() { return window.location.search.indexOf('category=') >= 0; },
			function() { return window.location.search.indexOf('channel=') >= 0; },
			function() { return window.location.search.indexOf('topic=') >= 0; }
		];
		if(skip_hero_pages.some(function(criteria) { return criteria(); }) )
		{
			setTimeout(function()
			{
				var top = $('.section-search').length > 0 ? $('.section-search').offset().top : $('.main').offset().top;
				$('html, body').animate({ scrollTop: top });
			}, 500);
		}
	});



	});

	 $win.on('load scroll', function(){
		var topPosition = $win.scrollTop()

		var winT = $win.scrollTop();
		var winH = $win.height();

		/**
		 * Intro Parallax Effect
		 */
		if($('.intro').length) {

			var introPos = Math.min(winT/6, winH);
			var introCont = Math.min(winT/4, winH);
			var opacityM = 1 - Math.min(winT*0.5)/800;

			$('.intro').find('.intro__image').css({
				'transform': 'translateY(' + introPos + 'px)',
				'-webkit-transform': 'translateY(' + introPos + 'px)',
				'-moz-transform': 'translateY(' + introPos + 'px)'
			});

			$('.intro .intro__content').css({
				'transform': 'translateY(' + introCont + 'px)',
				'-webkit-transform': 'translateY(' + introCont + 'px)',
				'-moz-transform': 'translateY(' + introCont + 'px)'
			});
		};

		if($('.article-single__intro').length) {

			var introPos = Math.min(winT/6, winH);
			var introCont = Math.min(winT/4, winH);
			var opacityM = 1 - Math.min(winT*0.5)/800;

			$('.article-single__intro').find('.article-single__image').css({
				'transform': 'translateY(' + introPos + 'px)',
				'-webkit-transform': 'translateY(' + introPos + 'px)',
				'-moz-transform': 'translateY(' + introPos + 'px)'
			});

			$('.article-single__intro .article-single__content').css({
				'transform': 'translateY(' + introCont + 'px)',
				'-webkit-transform': 'translateY(' + introCont + 'px)',
				'-moz-transform': 'translateY(' + introCont + 'px)'
			});

			// $('.article-single__intro').css({
			// 	'opacity' : opacityM
			// });
		};
		parallaxEffect();
		visibleElement(topPosition);

		setTimeout(function() {
			performanceData(topPosition);
		}, 100);

		/**
		 * Ajax loading
		 */
		if ( $('.section__loader').length ) {
			if ( (topPosition + $win.height()) > $('.section__loader').offset().top - 400 ) {
				loadMore();
			}
		}

		$('.header').toggleClass('fixed', $win.scrollTop() > 10);
	});

	 $win.on('load resize', function() {
	 	initWall('.feeds-holder', '.feeds', '.feeds .feed');
	 });

})(jQuery, window, document);
