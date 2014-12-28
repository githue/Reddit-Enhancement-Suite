modules['hover'] = {
	moduleID: 'hover',
	moduleName: 'Hover Pop-up Behaviour',
	category: 'About RES',
	description: 'Control what happens when you hover over a link to a user page, subreddit or parent comment. Pop-ups can be turned on or off at the relevant settings pages: <a href="#!settings/subredditInfo">Subreddit Info</a>, <a href="#!settings/userTagger/hoverInfo">User Hover Info</a>, <a href="#!settings/showParent">Show Parent on Hover</a>.',
	alwaysEnabled: true,
	options: {
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
			description: 'Speed in <em>seconds</em> to fade in and out (default: 0.3).',
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
	},
	isEnabled: function() {
		return RESConsole.getModulePrefs(this.moduleID);
	},
	include: [
		'all',
	],
	isMatchURL: function() {
		return RESUtils.isMatchURL(this.moduleID);
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			// timeout vars.
			var popupOpenDelay;
			var popupCloseDelay;
			
			// option values.
			var fadeSpeed = parseFloat(this.options.fadeSpeed.value);
			var maxWidth = parseInt(this.options.width.value, 10);
			
			RESUtils.addCSS('.RESLink-subreddit { background: rgba(255,200,0,.5); }');
			RESUtils.addCSS('.RESLink-user { background: rgba(0,200,255,.5); }');
			
			// everything directly relating to the pop-up.
			RESUtils.addCSS('.RESPopup:before { position: absolute; top: 5px; left: -15px; display: block; content: " "); border: 7px solid transparent; border-style: solid solid outset; border-right-color: rgb(0, 0, 0); }');
			RESUtils.addCSS('.RESPopup.rightArrow:before { left: auto; right: -15px; border-right-color: transparent; border-left-color: rgb(0, 0, 0); }');
			RESUtils.addCSS('.RESPopup { bottom: 0; right: 0; font-size: 12px; position: absolute; box-sizing: border-box; max-width: '+ maxWidth +'px; padding: 0px; border: 1px solid rgb(197, 209, 219); border-radius: 5px; box-shadow: 2px 2px 2px 0px rgba(0,0,0,.15); 	background-image: linear-gradient(rgb(255, 255, 255) 60%, rgb(242, 242, 242)); visibility: hidden; opacity: 0; transition: opacity ' + fadeSpeed + 's, visibility ' + fadeSpeed + 's, box-shadow .1s; z-index: 10002; }');
			RESUtils.addCSS('.RESPopupVisible, .RESPopupActive { visibility: visible; opacity: 1; }');
			RESUtils.addCSS('.RESPopupActive { visibility: visible; opacity: 1; box-shadow: 0px 6px 10px 0px rgba(0,0,0,.2); }');
			RESUtils.addCSS('.RESPopup .RESPopupTitle { padding: 5px 50px 5px 15px; border-radius: 5px 5px 0 0; background: rgba(240, 243, 252,1); overflow: hidden; }');
			RESUtils.addCSS('.RESPopup h3 { font-size: 17px; font-weight: normal; color: rgb(50,100,150); margin: 0; padding: 0; letter-spacing: -1px; }');
			RESUtils.addCSS('.RESPopup-user h3 { display: inline-block; margin: 0 5px 0 0; }');
			RESUtils.addCSS('.RESPopup .RESPopupAbout { line-height: 2; padding: 5px 15px 5px 15px; }');
			RESUtils.addCSS('.RESPopup .RESPopupAbout p { margin: 0; }');
			RESUtils.addCSS('.RESPopup .over18 { color: rgb(120, 120, 120); font-size: 12px; padding: 2px 3px; border-width: 1px; border-style: solid; border-color: rgb(197, 209, 219); border-radius: 3px; }');
			RESUtils.addCSS('.RESPopup .RESPopupOptions { margin: 0px; padding: 10px 15px; border-top: 1px solid rgb(197, 209, 219); border-bottom: 1px solid rgb(197, 209, 219); }');
			RESUtils.addCSS('.RESPopup .RESPopupOption { cursor: pointer; font-weight: bold; font-size: 10px; color: rgb(255,255,255); padding: 1px 5px; background-image: linear-gradient(rgb(123,184,80), rgb(118,170,74)); border: 1px solid rgb(68,68,68); border-radius: 3px; } ');
			RESUtils.addCSS('.RESPopup .RESPopupOption.remove { background-image: linear-gradient(rgb(207, 97, 101), rgb(192, 95, 97)); }');
			RESUtils.addCSS('.RESPopup .RESPopupOptions .RESPopupOption { margin: 0 3px 0 0; }');
			RESUtils.addCSS('.RESPopup .RESPopupOptions span.disabled { opacity: .2; }');
			RESUtils.addCSS('.RESPopup .RESshortcutside { margin-top: 0; width: auto; }');
			RESUtils.addCSS('.RESPopup .RESPopupClose { position: absolute; right: 5px; top: -1px; line-height: 1; font-size: 17px; padding: 0 10px; color: rgb(197, 209, 219); border: 1px solid rgb(197, 209, 219); background: rgb(255, 255, 255); border-radius: 0 0 3px 3px; cursor: pointer; box-shadow: 0 0 0px 1px rgba(255,255,255,0); transition: box-shadow .2s; }');
			RESUtils.addCSS('.RESPopup .RESPopupClose:hover { color: rgb(200,50,50); }');
			RESUtils.addCSS('.RESPopup .karma span { padding: 0px 5px; color: rgb(120, 120, 120); cursor: help; }');
			RESUtils.addCSS('.RESPopup .karma span:first-child { border-width: 1px 1px 1px 1px; border-style: solid; border-color: rgb(197, 209, 219); border-radius: 3px 0 0 3px; }');
			RESUtils.addCSS('.RESPopup .karma span:last-child { border-width: 1px 1px 1px 0px; border-style: solid; border-color: rgb(197, 209, 219); border-radius: 0 3px 3px 0; }');
			RESUtils.addCSS('.RESPopup abbr { cursor: help; border-bottom: 1px dotted rgb(180,180,180); }');
			RESUtils.addCSS('.RESPopup .has-gold { display: inline-block; margin: 0 0 0 5px; width: 24px !important; height: 14px !important; background: url(http://www.redditstatic.com/sprite-reddit.JqPSSyjOUZE.png) no-repeat -84px -818px; vertical-align: text-bottom; }');
			RESUtils.addCSS('.RESPopup ul.actions { margin: 0; padding: 5px 0 10px 15px; list-style: none; }');
			RESUtils.addCSS('.RESPopup ul.actions li { display: inline-block; margin: 0 10px 0 0; }');
			RESUtils.addCSS('.RESPopup li.send-message a:before { content: " "; display: inline-block; width: 15px; height: 10px; margin: 0 3px 0 0; background: url(http://www.redditstatic.com/mailgray.png) no-repeat 0px 0px; vertical-align: middle; }');
			RESUtils.addCSS('.RESPopup li.give-gold a:before { content: " "; display: inline-block; width: 15px; height: 15px; margin: 0 3px 0 0; background: url(http://www.redditstatic.com/sprite-reddit.JqPSSyjOUZE.png) no-repeat -87px -796px; vertical-align: middle; }');
			RESUtils.addCSS('.RESPopup .RESPopupDeeplinks { font-size: 12px; margin: 0; padding: 0 10px; list-style: none; border-top: 1px solid rgb(197, 209, 219); }');
			RESUtils.addCSS('.RESPopup .RESPopupDeeplinks li { display: inline-block; margin: 0; padding: 0; border-right: 1px solid rgb(197, 209, 219); }');
			RESUtils.addCSS('.RESPopup .RESPopupDeeplinks li a { display: inline-block; padding: 1px 5px 1px 5px; }');
			RESUtils.addCSS('.RESPopup .RESPopupDeeplinks li a:hover { background: rgba(240, 243, 252,1); }');
			RESUtils.addCSS('.RESPopup .RESPopupDeeplinks li:last-child { border-right: none; }');
			
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
			var userLinks = document.body.querySelectorAll('.usertext-body a[href^="/u/"], .usertext-body a[href^="/user/"], a.author');
			
			// Handle user links and add classes.
			/*for (var i = 0; i < userLinks.length; i++) {
				userLink = userLinks[i];
				userLink.classList.add('res-link-popup', 'RESLink-user');
				
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
			
		}
	},
	createPopup: function(type) {
		document.body.insertAdjacentHTML('beforeend', ' \
		<div class="RESPopup RESPopup-'+ type +'"> \
			<div class="RESPopupTitle"> \
				<h3> \
					<span class="RESPopupHeading"></span> \
					<span class="RESPopupExtraInfo"></span> \
					<span class="RESThrobberSml"></span> \
				</h3> \
				<span class="RESPopupClose">&times;</span> \
			</div> \
			<ul class="RESPopupDeeplinks"> \
			</ul> \
			<div class="RESPopupOptions"> \
			</div> \
			<div class="RESPopupAbout"> \
			</div> \
		</div> \ ');
		
		// handle close button.
		$('.RESPopup .RESPopupClose').click(function() {
			modules['hover'].popupClose();
		});
	},
	popupOpen: function(link, name, callback) {
		//console.log('popupOpen ' + name);
		var popup;
		
		// Determine popup type.
		if (link.classList.contains('RESLink-user')) {
			popup = $('.RESPopup-user');
		} else if (link.classList.contains('RESLink-subreddit')) {
			popup = $('.RESPopup-subreddit');
		} else {
			popup = $('.RESPopup-comment');
		}
		
		// positioning.
		var windowWidth = document.body.clientWidth;
		var linkWidth = link.offsetWidth;
		// use jquery offset() to work inside table cells.
		var topSpace = $(link).offset().top;
		var leftSpace = $(link).offset().left;
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
		
		popup.addClass("RESPopupVisible");
		callback('', name, '');
	},
	popupOpenDelayed: function(link, name, callback) {
		//console.log('popupOpenDelayed');
		var openDelay = parseFloat(this.options.openDelay.value) * 1000;
					
		// close and re-open if moving from one link to another (link sweeping).
		if ($('.RESPopup').css('visibility') === 'visible') {
			//console.log('link sweep');
			modules['hover'].popupClose();
			// for when fadeDelay is longer than openDelay:
			modules['hover'].popupCloseClearTimeout();
		}
		popupOpenDelay = window.setTimeout(modules['hover'].popupOpen, openDelay, link, name, callback);
	},
	popupClose: function(e) {
		//console.log('popupClose');
		var popup = $('.RESPopup');
		popup.removeClass('RESPopupVisible');
		popup.removeClass('RESPopupActive');
	},
	popupCloseDelayed: function(e) {
		//console.log('popupCloseDelayed');
		var closeDelay = parseFloat(this.options.fadeDelay.value) * 1000;
		var autoClose = this.options.closeOnMouseOut.value;
		modules['hover'].popupClearTimeout();
		popupCloseDelay = window.setTimeout(modules['hover'].popupClose, closeDelay);
		// don't close popup if it's engaged.
		if ($('.RESPopup').hasClass('RESPopupActive') || !autoClose) {
			//console.log('don\'t close yet');
			modules['hover'].popupCloseClearTimeout();
			return;
		}
	},
	popupEngage: function(type) {	
		var autoClose = this.options.closeOnMouseOut.value;
		var popup = document.querySelector('.RESPopup-' + type);
		popup.addEventListener('mouseenter', function() {	
			//console.log('popupEngage');	
			modules['hover'].popupCloseClearTimeout();
			popup.classList.add('RESPopupActive');
		}, false);
		popup.addEventListener('mouseleave', function() {
			popup.classList.remove('RESPopupActive');
			modules['hover'].popupCloseDelayed();
		}, false);
	},
	popupClearTimeout: function() {
		//console.log('popupClearTimeout');
		window.clearTimeout(popupOpenDelay);
	},
	popupCloseClearTimeout: function() {
		//console.log('popupCloseClearTimeout');
		window.clearTimeout(popupCloseDelay);
	},
};