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
			description: 'Add a quick link to the subreddit <em>hot</em> listing.',
		},
		deeplinkNew: {
			type: 'boolean',
			value: true,
			description: 'Add a quick link to the subreddit <em>new</em> listing.',
		},
		deeplinkRising: {
			type: 'boolean',
			value: true,
			description: 'Add a quick link to the subreddit <em>rising</em> listing.',
		},
		deeplinkControversial: {
			type: 'boolean',
			value: false,
			description: 'Add a quick link to the subreddit <em>controversial</em> listing.',
		},
		deeplinkTop: {
			type: 'boolean',
			value: true,
			description: 'Add a quick link to the subreddit <em>top</em> listing.',
		},
		deeplinkGilded: {
			type: 'boolean',
			value: true,
			description: 'Add a quick link to the subreddit <em>gilded</em> listing.',
		},
		deeplinkWiki: {
			type: 'boolean',
			value: true,
			description: 'Add a quick link to the subreddit <em>wiki</em> page.',
		},
		deeplinkComments: {
			type: 'boolean',
			value: false,
			description: 'Add a quick link to the subreddit <em>comments</em> listing.',
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
			
			// create a cache for subreddit data so we only load it once even if the hover is triggered many times
			this.subredditInfoCache = [];
			this.srRe = /\/r\/(\w+)(?:\/(new|rising|controversial|top))?\/?$/i;

			// get subreddit links and add event listeners...
			this.addListeners();
			RESUtils.watchForElement('siteTable', modules['subredditInfo'].addListeners);
		}
	},
	addListeners: function(ele) {
		// Identify all the usable links.
		var subLinks = document.body.querySelectorAll('.usertext-body a[href^="/r/"], div.wiki a[href^="/r/"], div.thing a.subreddit');
		
		// Handle subreddit links.
		if (subLinks) {
			for (var i = 0; i < subLinks.length; i++) {
				var subLink = subLinks[i];
				if (modules['subredditInfo'].srRe.test(subLink.href)) {
					subLink.classList.add('res-link-popup', 'res-link-subreddit');
					
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
		
		// Engage popup for interaction.
		modules['hover'].popupEngage('subreddit');
	},
	showSubredditInfo: function(def, subreddit, context) {
		var popup = document.querySelector('.res-popup-subreddit');
		var m = modules['subredditInfo'];
		var thisSubreddit = subreddit.toLowerCase();
		var popupTitle = popup.querySelector('h3');
		var RESThrobberSml = $('<span class="RESThrobberSml"></span>');
		var popupDeeplinks = popup.querySelector('.deeplinks');
		var popupOptions = popup.querySelector('.options');
		var uniqueData = popup.querySelectorAll('.unique');
		var link = $('<a href="/r/' + escapeHTML(thisSubreddit) + '">/<strong>r</strong>/' + escapeHTML(thisSubreddit) + '</a>');
		
		popupTitle.innerHTML = '';
		popupTitle.appendChild(link[0]);
		popupTitle.appendChild(RESThrobberSml[0]);
		
		for (var i = 0; i < uniqueData.length; i++) {
			uniqueData[i].innerHTML = '';
		}
		
		if (RESUtils.loggedInUser()) {
			var subscribeToggle = $('<span />');
			subscribeToggle
				.attr('id', 'RESHoverInfoSubscriptionButton')
				.addClass('RESFilterToggle')
				.addClass('disabled')
				.on('click', modules['subredditInfo'].toggleSubscription);
			modules['subredditInfo'].updateToggleButton(subscribeToggle, false);

			popupOptions.innerHTML = '';
			popupOptions.appendChild(subscribeToggle[0]);
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
		var popup = document.querySelector('.res-popup-subreddit');
		if (!jsonData.data) {
			var popupTitle = popup.querySelector('h3');
			popupTitle.innerText = 'Subreddit not found';
			
			//deferred.resolve(null, body);
			return;
		}
		var subredditTitle = popup.querySelector('.subredditTitle span');
		var subscribers = popup.querySelector('.subscribers span');
		var date = popup.querySelector('.date abbr');
		var utctime = jsonData.data.created_utc;
		var d = new Date(utctime * 1000);
		var isOver18 = $('<span class="adult data">18<sup>+</sup></span>');
		
		jsonData.data.over18 === true ? isOver18 = isOver18 : isOver18 = '';
		$('.res-popup-subreddit h3').append(' &nbsp;').append(isOver18);
		
		subredditTitle.innerText = escapeHTML(jsonData.data.title);
		subscribers.innerText = RESUtils.addCommas(jsonData.data.subscribers);
		date.innerText = RESUtils.niceDate(d, this.options.USDateFormat.value);
		date.title = RESUtils.niceDateDiff(d);

		if (modules['subredditManager'].isEnabled() && jsonData.data) {
			var shortcut = document.createElement('span');
			shortcut.setAttribute('style', 'display: inline-block !important;');
			shortcut.setAttribute('class', 'REStoggle RESshortcut RESshortcutside');
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
			shortcut.addEventListener('click', modules['subredditManager'].toggleSubredditShortcut, false);

			$('.res-popup-subreddit').find('.options').append(shortcut);
		}
		if (modules['dashboard'].isEnabled()) {
			var dashboardToggle = document.createElement('span');
			dashboardToggle.setAttribute('class', 'RESDashboardToggle');
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
			dashboardToggle.addEventListener('click', modules['dashboard'].toggleDashboard, false);
			$('.res-popup-subreddit').find('.options').append(dashboardToggle);
		}
		if (modules['filteReddit'].isEnabled()) {
			var filterToggle = document.createElement('span');
			filterToggle.setAttribute('class', 'RESFilterToggle');
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
			filterToggle.addEventListener('click', modules['filteReddit'].toggleFilter, false);
			$('.res-popup-subreddit').find('.options').append(filterToggle);
		}

		if (RESUtils.loggedInUser()) {
			var subscribed = !! jsonData.data.user_is_subscriber;

			var subscribeToggle = $('#RESHoverInfoSubscriptionButton');
			subscribeToggle.attr('data-subreddit', jsonData.data.display_name.toLowerCase());
			modules['subredditInfo'].updateToggleButton(subscribeToggle, subscribed);
			subscribeToggle.removeClass('disabled');
		}
		
		var o = modules['subredditInfo'].options;
		var name = jsonData.data.display_name;
		
		var deeplinkHot = (o.deeplinkHot.value) ? $('<li><a href="/r/'+ name +'">hot</a></li>') : '';
		var deeplinkNew = (o.deeplinkNew.value) ? $('<li><a href="/r/'+ name +'/new">new</a></li>') : '';
		var deeplinkRising = (o.deeplinkRising.value) ? $('<li><a href="/r/'+ name +'/rising">rising</a></li>') : '';
		var deeplinkControversial = (o.deeplinkControversial.value) ? $('<li><a href="/r/'+ name +'/controversial">controversial</a></li>') : '';
		var deeplinkTop = (o.deeplinkTop.value) ? $('<li><a href="/r/'+ name +'/top">top</a></li>') : '';
		var deeplinkGilded = (o.deeplinkGilded.value) ? $('<li><a href="/r/'+ name +'/gilded">gilded</a></li>') : '';
		var deeplinkWiki = (o.deeplinkWiki.value) ? $('<li class="unique"><a href="/r/'+ name +'/wiki">wiki</a></li>') : '';
		var deeplinkComments = (o.deeplinkComments.value) ? $('<li><a href="/r/'+ name +'/comments">comments</a></li>') : '';
		
		var deeplinks = $('.res-popup-subreddit .deeplinks');
		deeplinks.empty();
		
		deeplinks.append(deeplinkHot);
		deeplinks.append(deeplinkNew);
		deeplinks.append(deeplinkRising);
		deeplinks.append(deeplinkControversial);
		deeplinks.append(deeplinkTop);
		deeplinks.append(deeplinkGilded);
		deeplinks.append(deeplinkWiki);
		deeplinks.append(deeplinkComments);
		
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
