addModule('hover', function(module, moduleID) {
	module.moduleName = 'Hover Pop-up Behaviour';
	module.category = 'My Modules';
	module.description = 'Applies to pop-ups for <em>user info</em>, <em>subreddit info</em> and <em>parent comments</em>.';
	//module.alwaysEnabled = true;
	module.options = {
		openDelay: {
			type: 'text',
			value: 0.5,
			description: 'Delay in <em>seconds</em> before a pop-up opens (default: 0.5).'
		},
		fadeDelay: {
			description: 'Delay in <em>seconds</em> before a pop-up closes (default: 0.2).',
			type: 'text',
			value: 0.2
		},
		fadeSpeed: {
			description: 'Speed in <em>seconds</em> to fade in and out (default: 0.3). Use 0 to disable fade.',
			type: 'text',
			value: 0.3
		},
		width:  {
			description: 'Maximum width in <em>pixels</em> of the pop-up (default: 450).',
			type: 'text',
			value: 450
		},
		closeOnMouseOut: {
			description: 'Automatically close the pop-up when you leave it (default: on).',
			type: 'boolean',
			value: true
		}
	};
	module.include = [
		'profile',
		/^https?:\/\/([a-z]+)\.reddit\.com\/message\/comments\/[-\w\.]+/i
	];
	module.go = function() {
		if ((module.isEnabled())) {
			// timeout vars.
			var popupOpenDelay;
			var popupCloseDelay;
			var dataLoadDelay; // simulate slow connection.
			
			// option values.
			var fadeSpeed = parseFloat(module.options.fadeSpeed.value);
			var maxWidth = parseInt(module.options.width.value, 10);
			
			RESUtils.addCSS('.res-link-subreddit { background: rgba(200,50,50,.2); }');
			RESUtils.addCSS('.res-link-user { background: rgba(50,200,50,.2); }');
			
			// everything directly relating to the pop-up.
			RESUtils.addCSS('.res-popup:before { position: absolute; top: 5px; left: -15px; display: block; content: " "); border: 7px solid transparent; border-style: solid solid outset; border-right-color: rgb(0, 0, 0); }');
			RESUtils.addCSS('.res-popup.rightArrow:before { left: auto; right: -15px; border-right-color: transparent; border-left-color: rgb(0, 0, 0); }');
			RESUtils.addCSS('.res-popup { bottom: 0; right: 0; font-size: 12px; position: absolute; box-sizing: border-box; max-width: '+ maxWidth +'px; padding: 0px; border: 1px solid rgb(197, 209, 219); border-radius: 5px; box-shadow: 2px 2px 2px 0px rgba(0,0,0,.15); 	background-image: linear-gradient(rgb(255, 255, 255) 60%, rgb(242, 242, 242)); visibility: hidden; opacity: 0; transition: opacity ' + fadeSpeed + 's, visibility ' + fadeSpeed + 's, box-shadow .1s; z-index: 10002; }');
			RESUtils.addCSS('.res-popup-visible, .res-popup-active { visibility: visible; opacity: 1; }');
			RESUtils.addCSS('.res-popup-active { visibility: visible; opacity: 1; box-shadow: 0px 6px 10px 0px rgba(0,0,0,.2); }');
			RESUtils.addCSS('.res-popup .title { padding: 5px 50px 5px 15px; border-radius: 5px 5px 0 0; background: rgba(240, 243, 252,1); overflow: hidden; }');
			RESUtils.addCSS('.res-popup h3 { font-size: 17px; font-weight: normal; color: rgb(50,100,150); margin: 0; padding: 0; letter-spacing: -1px; }');
			RESUtils.addCSS('.res-popup-user h3 { display: inline-block; margin: 0 5px 0 0; }');
			RESUtils.addCSS('.res-popup .title p { color: rgb(100,100,100); margin: 0; }');
			RESUtils.addCSS('.res-popup .about { line-height: 2; padding: 5px 15px 5px 15px; }');
			RESUtils.addCSS('.res-popup .about p { margin: 0; }');
			RESUtils.addCSS('.res-popup .adult { color: rgb(120, 120, 120); font-size: 12px; padding: 2px 3px; border-width: 1px; border-style: solid; border-color: rgb(197, 209, 219); border-radius: 3px; }');
			RESUtils.addCSS('.res-popup .options { margin: 0px; padding: 10px 15px; border-top: 1px solid rgb(197, 209, 219); border-bottom: 1px solid rgb(197, 209, 219); }');
			RESUtils.addCSS('.res-popup .options .option { margin: 0 3px 0 0; }');
			RESUtils.addCSS('.res-popup span.option a { color: rgb(180,180,180); font-weight: bold; font-size: 11px; padding: 1px 5px; 	background-image: linear-gradient(rgb(140,140,140), rgb(120,120,120)); border: 1px solid rgb(68,68,68); border-radius: 3px; }');
			RESUtils.addCSS('.res-popup span.option.loaded a { color: rgb(255,255,255); 	background-image: linear-gradient(rgb(123,184,80), rgb(118,170,74)); }');
			RESUtils.addCSS('.res-popup span.option.loaded.checked a { color: rgb(255,255,255); 	background-image: linear-gradient(rgb(207, 97, 101), rgb(192, 95, 97)); }');
			RESUtils.addCSS('.res-popup .data { visibility: hidden; width: 0; height: 0; transition: visibility ' + fadeSpeed + 's; }');
			RESUtils.addCSS('.res-popup-visible .data.loaded, .res-popup-active .data.loaded { visibility: visible; width: auto; height: auto; }');
			RESUtils.addCSS('.res-popup .close { position: absolute; right: 5px; top: -1px; line-height: 1; font-size: 17px; padding: 0 10px; color: rgb(197, 209, 219); border: 1px solid rgb(197, 209, 219); background: rgb(255, 255, 255); border-radius: 0 0 3px 3px; cursor: pointer; box-shadow: 0 0 0px 1px rgba(255,255,255,0); transition: box-shadow .2s; }');
			RESUtils.addCSS('.res-popup .close:hover { color: rgb(200,50,50); }');
			RESUtils.addCSS('.res-popup .karma span { padding: 0px 5px; color: rgb(120, 120, 120); cursor: help; }');
			RESUtils.addCSS('.res-popup .karma span:first-child { border-width: 1px 1px 1px 1px; border-style: solid; border-color: rgb(197, 209, 219); border-radius: 3px 0 0 3px; }');
			RESUtils.addCSS('.res-popup .karma span:last-child { border-width: 1px 1px 1px 0px; border-style: solid; border-color: rgb(197, 209, 219); border-radius: 0 3px 3px 0; }');
			RESUtils.addCSS('.res-popup abbr { cursor: help; border-bottom: 1px dotted rgb(180,180,180); }');
			RESUtils.addCSS('.res-popup .has-gold { display: inline-block; margin: 0 0 0 5px; width: 24px !important; height: 14px !important; background: url(http://www.redditstatic.com/sprite-reddit.JqPSSyjOUZE.png) no-repeat -84px -818px; vertical-align: text-bottom; }');
			RESUtils.addCSS('.res-popup ul.actions { margin: 0; padding: 5px 0 10px 15px; list-style: none; }');
			RESUtils.addCSS('.res-popup ul.actions li { display: inline-block; margin: 0 10px 0 0; }');
			RESUtils.addCSS('.res-popup li.send-message a:before { content: " "; display: inline-block; width: 15px; height: 10px; margin: 0 3px 0 0; background: url(http://www.redditstatic.com/mailgray.png) no-repeat 0px 0px; vertical-align: middle; }');
			RESUtils.addCSS('.res-popup li.give-gold a:before { content: " "; display: inline-block; width: 15px; height: 15px; margin: 0 3px 0 0; background: url(http://www.redditstatic.com/sprite-reddit.JqPSSyjOUZE.png) no-repeat -87px -796px; vertical-align: middle; }');
			RESUtils.addCSS('.res-popup ul.deeplinks { font-size: 12px; margin: 0; padding: 0 10px; list-style: none; border-top: 1px solid rgb(197, 209, 219); } ul.deeplinks li { display: inline-block; margin: 0; padding: 0; border-right: 1px solid rgb(197, 209, 219); }');
			RESUtils.addCSS('.res-popup ul.deeplinks li a { display: inline-block; padding: 1px 5px 1px 5px; }');
			RESUtils.addCSS('.res-popup ul.deeplinks li a:hover { background: rgba(240, 243, 252,1); }');
			RESUtils.addCSS('.res-popup ul.deeplinks li:last-child { border-right: none; }');
			
			RESUtils.addCSS('strong { font-weight: bold; }');
			
			// Throbber small version.
			RESUtils.addCSS('.RESThrobberSml, .RESThrobberSml:before, .RESThrobberSml:after {   font-size: 0;   position: relative;   display: inline-block;   background: rgb(180, 180, 200);   height: 10px;   width: 10px;   border-radius: 50%;   -moz-animation: RESThrobberSml 1400ms 200ms infinite linear;   -webkit-animation: RESThrobberSml 1400ms 200ms infinite linear;   animation: RESThrobberSml 1400ms 200ms infinite linear; }');
			RESUtils.addCSS('.RESThrobberSml {   margin: 0 0 0 10px; }');
			RESUtils.addCSS('.RESThrobberSml:before {   left: 125%;   -moz-animation-delay: 400ms;   -webkit-animation-delay: 400ms;   animation-delay: 400ms; }');
			RESUtils.addCSS('.RESThrobberSml:after {   left: 250%;   -moz-animation-delay: 600ms;   -webkit-animation-delay: 600ms;   animation-delay: 600ms; }');
			RESUtils.addCSS('.RESThrobberSml:before, .RESThrobberSml:after {   content: "";   position: absolute;   top: 0; }');
			RESUtils.addCSS('@-webkit-keyframes RESThrobberSml {   30% { background: transparent; }   70% { background: transparent; } }');
			RESUtils.addCSS('@keyframes RESThrobberSml {   30% { background: transparent; }   70% { background: transparent; } }');

			// Identify all the usable links.
			//var subLinks = document.body.querySelectorAll('.usertext-body a[href^="/r/"]');
			var userLinks = document.body.querySelectorAll('.usertext-body a[href^="/u/"], .usertext-body a[href^="/user/"], a.author');
			
			// create a cache for subreddit data.
			this.subredditInfoCache = [];
			
			// Handle subreddit links and add classes.
			/*for (var i = 0; i < subLinks.length; i++) {
				subLink = subLinks[i];
				subLink.classList.add('res-link-popup', 'res-link-subreddit');
				
				subLink.addEventListener('mouseenter', function(e) {
					// get the name.
					var subreddit = this.href.split('/r/')[1];
					// exclude anything after the name.
					var subreddit = subreddit.split('/')[0];
					popupClose();
					popupOpenDelayed(this, subreddit);
				}, false);
				
				subLink.addEventListener('mouseleave', function(e) {
					popupClearTimeout();
					popupCloseDelayed();
				}, false);
			}*/
			
			// Handle user links and add classes.
			/*for (var i = 0; i < userLinks.length; i++) {
				userLink = userLinks[i];
				userLink.classList.add('res-link-popup', 'res-link-user');
				
				userLink.addEventListener('mouseenter', function(e) {
					// get the name.
					var user = this.href.split(/\/user\/|\/u\//)[1];
					// exclude anything after the name.
					var user = user.split('/')[0];
					popupClose();
					popupOpenDelayed(this, user);
				}, false);
				
				userLink.addEventListener('mouseleave', function(e) {
					popupClearTimeout();
					popupCloseDelayed();
				}, false);
			}*/
			
			
			
			/**
			 * prepared script
			 */
			/*// timeout vars
			var hoverPopupDelay;
			var hoverCloseDelay;
			var dataLoadDelay; // simulate slow connection.
			
			// timeout functions
			function delayedPopup(e, openDelay) {
				console.log(openDelay);
				hoverPopupDelay = window.setTimeout(showPopup, openDelay * 1000, e);
			}
			function delayedClosePopup(fadeDelay) {
				// don't close popup if it's in use.
				if ($('.res-popup').hasClass('res-popup-active')) {
					return;
				}
				hoverCloseDelay = window.setTimeout(closePopup, fadeDelay * 1000);
			}
			function delayedDataLoad() {
				dataLoadDelay = window.setTimeout(loadData, 2000);
			}
			
			// Simulate loading data.
			function loadData() {
				$('.res-popup-visible .data, \
					 .res-popup-active .data, \
					 .res-popup-visible .option, \
					 .res-popup-active .option').addClass('loaded');
					 
				$('.res-popup-visible .RESThrobberSml, .res-popup-active .RESThrobberSml').hide();
			}
			
			// handle popups.
			function showPopup(e) {
				var popup;
				// select appropriate popup style.
				if (e.classList.contains('res-link-user')) {
					popup = $('.res-popup-user');
				} else {
					popup = $('.res-popup-subreddit');
				}
				
				// position data.
				var windowWidth = document.body.clientWidth;
				var linkWidth = e.offsetWidth;
				var offsetTop = e.offsetTop;
				var leftSpace = e.offsetLeft;
				var rightSpace = windowWidth - leftSpace - linkWidth;
				
				popup.css('top', offsetTop - 5 + 'px');
				if (leftSpace < rightSpace) {
					popup.css('left', leftSpace + linkWidth + 15 + 'px');
					popup.css('right', 'auto');
					popup.removeClass('rightArrow');
				} else {
					popup.addClass('rightArrow');
					popup.css('left', 'auto');
					popup.css('right', rightSpace + linkWidth + 30 + 'px');
				}
				
				popup.addClass("res-popup-visible");
				delayedDataLoad();
			}
			function closePopup() {
				var popup = $('.res-popup');
				popup.removeClass("res-popup-visible");
				$('.res-popup-visible .data').removeClass('loaded');
			}
			function clearPopup() {
				window.clearTimeout(hoverPopupDelay);
			}
			function clearClosePopup() {
				window.clearTimeout(hoverCloseDelay);
			}
			$('.res-link-popup').mouseenter(function(e, openDelay) {
				delayedPopup(e.target, openDelay);
			});
			$('.res-link-popup').mouseleave(function(fadeDelay) {
				clearPopup();
				delayedClosePopup(fadeDelay);
			});
			// Popup is currently in use.
			$('.res-popup').mouseenter(function() {
				if ($(this).css('opacity') > '0.9') {
					$(this).addClass('res-popup-active');
				}
			});
			$('.res-popup').mouseleave(function() {
				$(this).removeClass('res-popup-active');
				closePopup();
			});
			$('.close').click(function() {
				clearPopup();
				var popup = $('.res-popup');
				popup.removeClass('res-popup-active');
			});*/
			// end prepared script
		}
	};
	module.createPopup = function(type) {
		document.body.insertAdjacentHTML('beforeend', ' \
		<div class="res-popup res-popup-'+ type +'"> \
			<div class="title"> \
				<h3><span class="RESThrobberSml"></span></h3> \
				<span class="close">&times;</span> \
			</div> \
			<ul class="deeplinks"> \
			</ul> \
			<div class="options"> \
			</div> \
			<div class="about"> \
			</div> \
		</div> \ ');
	};
	module.popupOpen = function(link, name) {
		console.log('popupOpen ' + name);
		
		var popup;
		
		// Determine popup type.
		if (link.classList.contains('res-link-user')) {
			popup = $('.res-popup-user');
		} else {
			popup = $('.res-popup-subreddit');
		}
		
		// positioning.
		var windowWidth = document.body.clientWidth;
		var linkWidth = link.offsetWidth;
		var topSpace = link.offsetTop;
		var leftSpace = link.offsetLeft;
		var rightSpace = windowWidth - leftSpace - linkWidth;
		
		popup.css('top', topSpace - 5 + 'px');
		popup.css('bottom', 'auto');
		if (leftSpace < rightSpace) {
			popup.css('right', 'auto');
			popup.css('left', leftSpace + linkWidth + 15 + 'px');
			popup.removeClass('rightArrow');
		} else {
			popup.addClass('rightArrow');
			popup.css('left', 'auto');
			popup.css('right', rightSpace + linkWidth + 30 + 'px');
		}
		
		popup.addClass("res-popup-visible");
		modules['hover'].delayedDataLoad();
	}
	module.popupOpenDelayed = function(link, name, callback) {
		var openDelay = parseFloat(module.options.openDelay.value);
		popupOpenDelay = window.setTimeout(modules['hover'].popupOpen, openDelay, link, name);
	}
	module.popupClose = function(e) {
		var popup = $('.res-popup');
		//console.log('popupClose');
		popup.removeClass("res-popup-visible");
		$('.res-popup-visible .data').removeClass('loaded');
	}
	module.popupCloseDelayed = function(e) {
		var closeDelay = parseFloat(module.options.fadeDelay.value);
		var autoClose = module.options.closeOnMouseOut.value;
		//console.log('popupCloseDelayed');
		// don't close popup if it's engaged.
		if ($('.res-popup').hasClass('res-popup-active') || !autoClose) {
			return;
		}
		popupCloseDelay = window.setTimeout(modules['hover'].popupClose, closeDelay);
	}
	module.popupEngage = function(type) {
		$('.res-popup-'+ type).hover(function(){
			$(this).addClass('res-popup-active');
		}, function() {
			$(this).removeClass('res-popup-active');
		});
	}
	module.popupClearTimeout = function(e) {
		//console.log('popupClearTimeout');
		window.clearTimeout(popupOpenDelay);
	}
	module.popupCloseClearTimeout = function(e) {
		window.clearTimeout(popupCloseDelay);
	}
	// Simulate loading data.
	module.delayedDataLoad = function() {
		//console.log('delayedDataLoad');
		dataLoadDelay = window.setTimeout(modules['hover'].loadData, 0);
	}
	module.loadData = function() {
		$('.res-popup-visible .data, \
			 .res-popup-active .data, \
			 .res-popup-visible .option, \
			 .res-popup-active .option').addClass('loaded');
			 
		$('.res-popup-visible .RESThrobberSml, .res-popup-active .RESThrobberSml').hide();
	}
	/*function createUserPopup() {
		document.querySelector('body').insertAdjacentHTML('beforeend', ' \
		<div class="res-popup res-popup-user"> \
			<div class="title"> \
				<h3><a href="#">/<strong>u</strong>/postpics</a><span class="RESThrobberSml"></span> &nbsp;<span class="adult data">18<sup>+</sup></span></h3> \
				<span class="close">&times;</span> \
			</div> \
			<ul class="deeplinks"> \
				<li><a href="#">hot</a></li><li><a href="#">new</a></li><li><a href="#">rising</a></li><li><a href="#">controversial</a></li><li><a href="#">top</a></li><li><a href="#">gilded</a></li><li class="data"><a href="#">wiki</a></li><li><a href="#">comments</a></li> \
			</ul> \
			<div class="options"> \
				<span class="option option-subscribe"><a href="#">+subscribe</a></span> \
				<span class="option option-shortcut checked"><a href="#">-shortcut</a></span> \
				<span class="option option-dashboard checked"><a href="#">-dashboard</a></span> \
				<span class="option option-filter"><a href="#">+filter</a></span> \
			</div> \
			<div class="about"> \
				<p><span class="subtitle data">Reddit Enhancement Suite</span></p> \
				<p><strong>Subscribers:</strong> <span class="data">67,741</span></p> \
				<p><strong>Created:</strong> <abbr class="data" title="4 years, 4 months and 8 days">2010-08-13</abbr></p> \
			</div> \
		</div> \ ');
	}
	function createSubredditPopup() {
		document.querySelector('body').insertAdjacentHTML('beforeend', ' \
		<div class="res-popup res-popup-subreddit"> \
			<div class="title"> \
				<h3><a href="#"></a><span class="RESThrobberSml"></span> &nbsp;<span class="adult data">18<sup>+</sup></span></h3> \
				<span class="close">&times;</span> \
			</div> \
			<ul class="deeplinks"> \
				<li><a href="#">hot</a></li><li><a href="#">new</a></li><li><a href="#">rising</a></li><li><a href="#">controversial</a></li><li><a href="#">top</a></li><li><a href="#">gilded</a></li><li class="data"><a href="#">wiki</a></li><li><a href="#">comments</a></li> \
			</ul> \
			<div class="options"> \
				<span class="option option-subscribe"><a href="#">+subscribe</a></span> \
				<span class="option option-shortcut checked"><a href="#">-shortcut</a></span> \
				<span class="option option-dashboard checked"><a href="#">-dashboard</a></span> \
				<span class="option option-filter"><a href="#">+filter</a></span> \
			</div> \
			<div class="about"> \
				<p><span class="subtitle data">Reddit Enhancement Suite</span></p> \
				<p><strong>Subscribers:</strong> <span class="data">67,741</span></p> \
				<p><strong>Created:</strong> <abbr class="data" title="4 years, 4 months and 8 days">2010-08-13</abbr></p> \
			</div> \
		</div> \ ');
	}*/
});