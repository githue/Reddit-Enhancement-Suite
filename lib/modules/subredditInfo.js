modules['subredditInfo'] = {
	moduleID: 'subredditInfo',
	moduleName: 'Subreddit Info',
	category: 'UI',
	options: {
		/*hoverDelay: {
			type: 'text',
			value: 800,
			description: 'Delay, in milliseconds, before hover tooltip loads. Default is 800.',
			advanced: true
		},
		fadeDelay: {
			type: 'text',
			value: 200,
			description: 'Delay, in milliseconds, before hover tooltip fades away. Default is 200.',
			advanced: true
		},
		fadeSpeed: {
			type: 'text',
			value: 0.3,
			description: 'Fade animation\'s speed. Default is 0.3, the range is 0-1. Setting the speed to 1 will disable the animation.',
			advanced: true
		},*/
		USDateFormat: {
			type: 'boolean',
			value: false,
			description: 'Show date (subreddit created...) in US format (i.e. 08-31-2010)',
			advanced: true
		},
		deeplinkHot: {
			type: 'boolean',
			value: true,
			description: 'Add a quick-link to the <em>hot</em> page.',
		},
		deeplinkNew: {
			type: 'boolean',
			value: true,
			description: 'Add a quick-link to the <em>new</em> page.',
		},
		deeplinkRising: {
			type: 'boolean',
			value: true,
			description: 'Add a quick-link to the <em>rising</em> page.',
		},
		deeplinkControversial: {
			type: 'boolean',
			value: false,
			description: 'Add a quick-link to the <em>controversial</em> page.',
		},
		deeplinkTop: {
			type: 'boolean',
			value: true,
			description: 'Add a quick-link to the <em>top</em> page.',
		},
		deeplinkGilded: {
			type: 'boolean',
			value: true,
			description: 'Add a quick-link to the <em>gilded</em> page.',
		},
		deeplinkWiki: {
			type: 'boolean',
			value: true,
			description: 'Add a quick-link to the <em>wiki</em> page.',
		},
		deeplinkComments: {
			type: 'boolean',
			value: false,
			description: 'Add a quick-link to the <em>latest comments</em> page.',
		}
	},
	description: 'Adds a hover tooltip to subreddits',
	isEnabled: function() {
		return RESConsole.getModulePrefs(this.moduleID);
	},
	include: [
		'all'
	],
	isMatchURL: function() {
		return RESUtils.isMatchURL(this.moduleID);
	},
	beforeLoad: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			var css = '';
			RESUtils.addCSS(css);
		}
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			// create popup and add it to	document body.
			modules['hover'].createPopup('subreddit');
		
			// Allow interaction with popup.
			modules['hover'].popupEngage('subreddit');
			
			// create a cache for subreddit data so we only load it once even if the hover is triggered many times
			this.subredditInfoCache = [];
			this.srRe = /\/r\/(\w+)(?:\/(new|rising|controversial|top))?\/?$/i;

			this.addListeners();
			// get subreddit links and add event listeners...
			RESUtils.watchForElement('siteTable', modules['subredditInfo'].addListeners);
			// Not sure how to get this to not duplicate event listeners:
			//RESUtils.watchForElement('selfText', modules['subredditInfo'].addListeners);
		}
	},
	addListeners: function(ele) {
		// To avoid doubling up event listeners with NER, only add listeners to the NEWEST sitetable div.
		var wrapper = document.body.querySelector('#siteTable > .sitetable:last-child');
		if (!wrapper) {
			wrapper = document.body;
		}
		// Identify all the usable links.
		var subLinks = wrapper.querySelectorAll('.usertext-body a[href^="/r/"], div.wiki a[href^="/r/"], div.thing a.subreddit');
		
		// Handle subreddit links.
		if (subLinks) {
			for (var i = 0; i < subLinks.length; i++) {
				var subLink = subLinks[i];
				if (modules['subredditInfo'].srRe.test(subLink.href)) {
					subLink.classList.add('RESLinkPopup', 'RESLink-subreddit');
					subLink.addEventListener('mouseenter', function(e) {
						var link = this;
						// get the subreddit name.
						var subreddit = link.href.split('/r/')[1];
						// exclude anything after the name.
						var subreddit = subreddit.split('/')[0];
						
						// open popup with callback to showSubredditInfo.
						modules['hover'].popupOpenDelayed(link, subreddit, modules['subredditInfo'].showSubredditInfo);
					}, false);
					
					subLink.addEventListener('mouseleave', function(e) {
						modules['hover'].popupCloseDelayed();
					}, false);
				}
			}
		}
	},
	showSubredditInfo: function(def, subreddit, context) {
		var popup = document.querySelector('.RESPopup-subreddit');
		var m = modules['subredditInfo'];
		var thisSubreddit = subreddit.toLowerCase();
		var popupTitle = popup.querySelector('h3 .RESPopupHeading');
		var extraInfo = popup.querySelector('h3 .RESPopupExtraInfo');
		var deeplinks = $('.RESPopup-subreddit .RESPopupDeeplinks');
		var popupOptions = popup.querySelector('.RESPopupOptions');
		var about = popup.querySelector('.RESPopupAbout');
		var subredditTitle = $('<p class="subredditTitle"><span class="unique"></span>&nbsp;</p>');
		var subscribers = $('<p class="RESPopupSubscribers"><strong>Subscribers:</strong> <span class="unique"></span></p>');
		var date = $('<p class="RESPopupDate"><strong>created:</strong> <abbr class="unique"></abbr></p>');
		var link = $('<a href="/r/' + escapeHTML(thisSubreddit) + '">/<strong>r</strong>/' + escapeHTML(thisSubreddit) + '</a>');
		
		popupTitle.innerHTML = '';
		extraInfo.innerHTML = '';
		popupTitle.appendChild(link[0]);
		//popupTitle.appendChild(RESThrobberSml[0]);
		
		about.innerHTML = '';
		about.appendChild(subredditTitle[0]);
		about.appendChild(subscribers[0]);
		about.appendChild(date[0]);
		
		popupOptions.innerHTML = '';
		// Set up subscribe button.
		if (RESUtils.loggedInUser()) {
			var subscribeToggle = $('<span />');
			subscribeToggle
				.addClass('RESPopupSubscribe')
				.addClass('RESPopupOption')
				.addClass('disabled')
				.on('click', modules['subredditInfo'].toggleSubscription);
			modules['subredditInfo'].updateToggleButton(subscribeToggle, false);
			popupOptions.appendChild(subscribeToggle[0]);
		}
		// Set up shortcut button.
		if (modules['subredditManager'].isEnabled()) {
			var shortcutToggle = $('<span />');
			shortcutToggle
				.addClass('RESPopupShortcut')
				.addClass('RESPopupOption')
				.addClass('disabled')
				.text('+shortcut')
				.on('click', modules['subredditManager'].toggleSubredditShortcut);
			popupOptions.appendChild(shortcutToggle[0]);
		}
		// Set up dashboard button.
		if (modules['dashboard'].isEnabled()) {
			var dashboardToggle = $('<span />');
			dashboardToggle
				.addClass('RESPopupDashboard')
				.addClass('RESPopupOption')
				.addClass('disabled')
				.text('+dashboard')
				.on('click', modules['dashboard'].toggleDashboard);
			popupOptions.appendChild(dashboardToggle[0]);
		}
		// Set up filter button.
		if (modules['filteReddit'].isEnabled()) {
			var filterToggle = $('<span />');
			filterToggle
				.addClass('RESPopupFilter')
				.addClass('RESPopupOption')
				.addClass('disabled')
				.text('+filter')
				.on('click', modules['filteReddit'].toggleFilter);
			popupOptions.appendChild(filterToggle[0]);
		}
		//def.notify(header, null);
		
		// use cached data if it's already created.
		if (typeof m.subredditInfoCache[thisSubreddit] !== 'undefined') {
			m.writeSubredditInfo(m.subredditInfoCache[thisSubreddit]/*, def*/);
		} else {
			// find the data.
			BrowserStrategy.ajax({
				method: 'GET',
				url: location.protocol + '//' + location.hostname + '/r/' + thisSubreddit + '/about.json?app=res',
				onload: function(response) {
					var thisResponse = safeJSON.parse(response.responseText, null, true);
					if (thisResponse) {
						m.updateCache(thisSubreddit, thisResponse);
						m.writeSubredditInfo(thisResponse/*, def*/);
					} else {
						m.writeSubredditInfo({}/*, def*/);
					}
				}
			});
		}
		
		// set up and add deeplinks.
		var o = modules['subredditInfo'].options;
		
		var deeplinkHot = (o.deeplinkHot.value) ? $('<li><a href="/r/'+ thisSubreddit +'">hot</a></li>') : '';
		var deeplinkNew = (o.deeplinkNew.value) ? $('<li><a href="/r/'+ thisSubreddit +'/new">new</a></li>') : '';
		var deeplinkRising = (o.deeplinkRising.value) ? $('<li><a href="/r/'+ thisSubreddit +'/rising">rising</a></li>') : '';
		var deeplinkControversial = (o.deeplinkControversial.value) ? $('<li><a href="/r/'+ thisSubreddit +'/controversial">controversial</a></li>') : '';
		var deeplinkTop = (o.deeplinkTop.value) ? $('<li><a href="/r/'+ thisSubreddit +'/top">top</a></li>') : '';
		var deeplinkGilded = (o.deeplinkGilded.value) ? $('<li><a href="/r/'+ thisSubreddit +'/gilded">gilded</a></li>') : '';
		var deeplinkWiki = (o.deeplinkWiki.value) ? $('<li class="unique"><a href="/r/'+ thisSubreddit +'/wiki">wiki</a></li>') : '';
		var deeplinkComments = (o.deeplinkComments.value) ? $('<li><a href="/r/'+ thisSubreddit +'/comments">comments</a></li>') : '';
		
		deeplinks.empty();
		
		deeplinks.append(deeplinkHot);
		deeplinks.append(deeplinkNew);
		deeplinks.append(deeplinkRising);
		deeplinks.append(deeplinkControversial);
		deeplinks.append(deeplinkTop);
		deeplinks.append(deeplinkGilded);
		deeplinks.append(deeplinkWiki);
		deeplinks.append(deeplinkComments);
	},
	updateCache: function(subreddit, data) {
		subreddit = subreddit.toLowerCase();
		if (!data.data) {
			data = {
				data: data
			};
		}
		this.subredditInfoCache = this.subredditInfoCache || [];
		this.subredditInfoCache[subreddit] = $.extend(true, {}, this.subredditInfoCache[subreddit], data);
	},
	writeSubredditInfo: function(jsonData, deferred) {
		var popup = document.querySelector('.RESPopup-subreddit');
		var subredditTitle = popup.querySelector('.subredditTitle span');
		var deeplinks = popup.querySelector('.RESPopupDeeplinks');
		var options = popup.querySelector('.RESPopupOptions');
		var subscribers = popup.querySelector('.RESPopupSubscribers span');
		var over18 = popup.querySelector('.RESPopupExtraInfo');
		// TBD: 404
		/*if (!jsonData.data.title) {
			subredditTitle.innerHTML = 'Subreddit not found';
			deeplinks.innerHTML = '';
			options.innerHTML = '';
			subscribers.parentNode.innerHTML = '';
			date.parentNode.innerHTML = '';
			isOver18.innerHTML = '';
			//deferred.resolve(null, body);
			return;
		}*/
		
		var utctime = jsonData.data.created_utc;
		var date = popup.querySelector('.RESPopupDate abbr');
		var d = new Date(utctime * 1000);
		
		if (jsonData.data.over18 === true) {
			over18.innerHTML = ' &nbsp;<span class="over18">18<sup>+</sup></span>';
		}
		subredditTitle.innerText = escapeHTML(jsonData.data.title);
		subscribers.innerText = RESUtils.addCommas(jsonData.data.subscribers);
		date.innerText = RESUtils.niceDate(d, this.options.USDateFormat.value);
		date.title = RESUtils.niceDateDiff(d);

		// handle subscribe button
		if (RESUtils.loggedInUser()) {
			var subscribed = !! jsonData.data.user_is_subscriber;

			var subscribeToggle = popup.querySelector('.RESPopupOptions .RESPopupSubscribe');
			subscribeToggle.classList.remove('disabled');
			subscribeToggle.setAttribute('data-subreddit', jsonData.data.display_name.toLowerCase());
			modules['subredditInfo'].updateToggleButton(subscribeToggle, subscribed);
		}

		// handle shortcut button.
		if (modules['subredditManager'].isEnabled() && jsonData.data) {
			var shortcut = popup.querySelector('.RESPopupOptions .RESPopupShortcut');
			shortcut.classList.remove('disabled');
			shortcut.setAttribute('data-subreddit', jsonData.data.display_name.toLowerCase());
			var idx = -1;
			for (var i = 0, len = modules['subredditManager'].mySubredditShortcuts.length; i < len; i++) {
				if (modules['subredditManager'].mySubredditShortcuts[i].subreddit.toLowerCase() === jsonData.data.display_name.toLowerCase()) {
					idx = i;
					break;
				}
			}
			if (idx !== -1) {
				shortcut.textContent = '-shortcut';
				shortcut.setAttribute('title', 'Remove this subreddit from your shortcut bar');
				shortcut.classList.add('remove');
			} else {
				shortcut.textContent = '+shortcut';
				shortcut.setAttribute('title', 'Add this subreddit to your shortcut bar');
			}

		}
		
		// handle dashboard button
		if (modules['dashboard'].isEnabled()) {
			var dashboardToggle = popup.querySelector('.RESPopupOptions .RESPopupDashboard');
			dashboardToggle.classList.remove('disabled');
			dashboardToggle.setAttribute('data-subreddit', jsonData.data.display_name.toLowerCase());
			var exists = false;
			for (var i = 0, len = modules['dashboard'].widgets.length; i < len; i++) {
				if ((modules['dashboard'].widgets[i]) && (modules['dashboard'].widgets[i].basePath.toLowerCase() === '/r/' + jsonData.data.display_name.toLowerCase())) {
					exists = true;
					break;
				}
			}
			if (exists) {
				dashboardToggle.textContent = '-dashboard';
				dashboardToggle.setAttribute('title', 'Remove this subreddit from your dashboard');
				dashboardToggle.classList.add('remove');
			} else {
				dashboardToggle.textContent = '+dashboard';
				dashboardToggle.setAttribute('title', 'Add this subreddit to your dashboard');
			}
		}
		
		// handle filter button
		if (modules['filteReddit'].isEnabled()) {
			var filterToggle = popup.querySelector('.RESPopupOptions .RESPopupFilter');
			filterToggle.classList.remove('disabled');
			filterToggle.setAttribute('data-subreddit', jsonData.data.display_name.toLowerCase());
			var exists = false;
			var filteredReddits = modules['filteReddit'].options.subreddits.value;
			for (var i = 0, len = filteredReddits.length; i < len; i++) {
				if ((filteredReddits[i]) && (filteredReddits[i][0].toLowerCase() === jsonData.data.display_name.toLowerCase())) {
					exists = true;
					break;
				}
			}
			if (exists) {
				filterToggle.textContent = '-filter';
				filterToggle.setAttribute('title', 'Stop filtering from /r/all and /domain/*');
				filterToggle.classList.add('remove');
			} else {
				filterToggle.textContent = '+filter';
				filterToggle.setAttribute('title', 'Filter this subreddit from /r/all and /domain/*');
			}
		}
		
		//deferred.resolve(null, body)
	},
	updateToggleButton: function(toggleButton, subscribed) {
		if (toggleButton instanceof jQuery) toggleButton = toggleButton[0];
		var toggleOn = '+subscribe';
		var toggleOff = '-unsubscribe';
		if (subscribed) {
			toggleButton.textContent = toggleOff;
			toggleButton.classList.add('remove');
		} else {
			toggleButton.textContent = toggleOn;
			toggleButton.classList.remove('remove');
		}
	},
	toggleSubscription: function(e) {
		// Get info
		var subscribeToggle = e.target;
		var subreddit = subscribeToggle.getAttribute('data-subreddit').toLowerCase();
		var subredditData = modules['subredditInfo'].subredditInfoCache[subreddit].data;
		var subscribing = !subredditData.user_is_subscriber;

		modules['subredditInfo'].updateToggleButton(subscribeToggle, subscribing);

		modules['subredditManager'].subscribeToSubreddit(subredditData.name, subscribing);
		modules['subredditInfo'].updateCache(subreddit, {
			'user_is_subscriber': subscribing
		});
	}
};
