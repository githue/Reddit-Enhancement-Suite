addModule('userInfo', function(module, moduleID) {
	module.moduleName = 'User Info Pop-up';
	module.category = 'Users';
	module.description = 'Customize the pop-up that appears when you mouse-over someone\'s username.';
	module.options = {
		width: {
			type: 'text',
			value: '450',
			description: 'Maximum width of the pop-up in <em>pixels</em>.'
		},
		USDateFormat: {
			type: 'boolean',
			value: false,
			description: 'Show date (Redditor since...) in US format (i.e. 08-31-2010)',
			advanced: true
		},
		gildComments: {
			type: 'boolean',
			value: true,
			description: 'Gild the user\'s comment when possible. Turn off if you want to gild the user\'s account when you click \'give gold\'.',
			advanced: true
		},
	};
	module.include = [
		'all',
		/^https?:\/\/([a-z]+)\.reddit\.com\/message\/comments\/[-\w\.]+/i
	];
	module.go = function() {
		if ((module.isEnabled()) && (module.isMatchURL())) {
			// create popup and add it to	document body.
			modules['hover'].createPopup('user');
		
			// Allow interaction with popup.
			modules['hover'].popupEngage('user');
			
			// create a cache for user data so we only load it once even if the hover is triggered many times
			this.userInfoCache = [];

			this.addListeners();
			// get user links and add event listeners...
			RESUtils.watchForElement('siteTable', modules['userInfo'].addListeners);
		}
	};
	module.addListeners = function(ele) {
	// To avoid doubling up event listeners with NER, only add listeners to the NEWEST sitetable div.
		var wrapper = document.body.querySelector('#siteTable > .sitetable:last-child');
		if (!wrapper) {
			wrapper = document.body;
		}
		// Identify all the usable links.
		// borrowed and extended from userTagger
		var userLinks = wrapper.querySelectorAll('\
			.noncollapsed a.author, \
			p.tagline a.author, \
			#friend-table span.user a, \
			.sidecontentbox a.author, \
			div.md a[href^="/u/"]:not([href*="/m/"]), \
			div.md a[href*="reddit.com/u/"]:not([href*="/m/"]), \
			div.md a[href^="/user/"]:not([href*="/m/"]), \
			div.md a[href*="reddit.com/user/"]:not([href*="/m/"]), \
			.usertable a.author, \
			.usertable span.user a, \
			div.wiki-page-content a.author \
		');

		// Handle user links.
		if (userLinks) {
			for (var i = 0; i < userLinks.length; i++) {
				var userLink = userLinks[i];
				// classes for testing purposes, remove when not testing.
				//userLink.classList.add('RESPopupLink', 'RESPopupLink-user');
				userLink.addEventListener('mouseenter', function(e) {
					var link = this;
					var href = this.href.toString();
					var username;
					// get the user name.
					if (href.indexOf('/u/') > -1) {
						username = href.split('/u/')[1];
					}
					else if (href.indexOf('/user/') > -1) {
						username = href.split('/user/')[1];
					}
					// exclude anything after the name.
					username = username.split('/')[0];
					
					// open popup with callback to showUserInfo.
					modules['hover'].popupOpenDelayed(link,	username, 'user',
						modules['userInfo'].showUserInfo,
						{width: modules['userInfo'].options.width.value});
				}, false);
				
				userLink.addEventListener('mouseleave', function(e) {
					modules['hover'].popupCloseDelayed();
				}, false);
			}
		}
	};
	module.showUserInfo = function(deferredReady, username, source) {
		var popup = document.querySelector('.RESPopup-user');
		var popupTitle = popup.querySelector('.RESPopupTitle');
		var extraInfo = popup.querySelector('.RESPopupExtraInfo');
		var deeplinks = $('.RESPopup-user .RESPopupDeeplinks');
		var popupOptions = popup.querySelector('.RESPopupOptions');
		var about = popup.querySelector('.RESPopupAbout');
		var karma = $('<span class="RESPopupKarma"> &nbsp;<span title="link karma">link</span><span title="comment karma">comment</span></span>');
		var date = $('<p class="RESPopupDate">Redditor for <abbr class="unique"></abbr></p>');
		var actions = popup.querySelector('.RESPopupActions');
		var sendMessage = $('<li class="RESPopupSendMessage"><a href="/message/compose/?to=' + username + '">send message</a></li>');
		var giveGold = $('<li class="RESPopupGiveGold"><a href="/gold?goldtype=gift&recipient=' + username + '">give gold</a></li>');
		var link = $('<a href="/user/' + username + '"><strong>/u/</strong>' + username + '</a>');
		
		// out with the old and in with the new
		popupTitle.innerHTML = '';
		extraInfo.innerHTML = '';
		popupOptions.innerHTML = '';
		about.innerHTML = '';
		actions.innerHTML = '';
		popupTitle.appendChild(link[0]);
		extraInfo.appendChild(karma[0]);
		about.appendChild(date[0]);
		actions.appendChild(sendMessage[0]);
		actions.appendChild(giveGold[0]);
		
		// quick message
		if (modules['userTagger'].options.useQuickMessage.value && modules['quickMessage'].isEnabled()) {
			sendMessage[0].querySelector('a').addEventListener('click', function(e) {
				if (e.which === 1) {
					e.preventDefault();
					modules['hover'].popupClose();
					modules['quickMessage'].openQuickMessageDialog({'to': escapeHTML(username)});
					modules['userTagger'].hideAuthorInfo();
				}
			}, false);
		}
		
		// give gold
		if (modules['userInfo'].options.gildComments.value && RESUtils.pageType() === 'comments' && giveGold) {
			giveGold[0].querySelector('a').addEventListener('click', function(e) {
				if (e.ctrlKey || e.cmdKey || e.shiftKey) {
					return;
				}
				var comment = $(source).closest('.comment');
				if (!comment) {
					return;
				}
				modules['hover'].popupClose();
				var giveGold = comment.find('.give-gold')[0];
				RESUtils.click(giveGold);
				e.preventDefault();
			});
		}
		
		// set up friends button
		if (RESUtils.loggedInUser()) {
			var friendsAdd = $('<a />');
			var friendsRm = $('<a />');
			friendsAdd
				.addClass('RESPopupFriendsAdd')
				.addClass('RESPopupOption')
				.addClass('option')
				.addClass('disabled')
				.attr('href', '#')
				.text('+ friends');
			friendsRm
				.addClass('option')
				.css('display', 'none')
				.attr('href', '#')
				.text('- friends');
			popupOptions.appendChild(friendsAdd[0]);
			popupOptions.appendChild(friendsRm[0]).insertAdjacentHTML('afterEnd', ' ');
		}
		
		// set up highlight button
		if (modules['userTagger'].options.highlightButton.value) {
			var highlightToggle = $('<span />');
			highlightToggle
				.addClass('RESPopupHighlight')
				.addClass('RESPopupOption')
				.addClass('disabled')
				.text('highlight');
				//.on('click', modules['userInfo'].toggleHighlight(this, jsonData.data.id));
			popupOptions.appendChild(highlightToggle[0]).insertAdjacentHTML('afterEnd', ' ');
		}
		
		// set up ignore button
		var ignoreToggle = $('<span />');
		ignoreToggle
			.addClass('RESPopupIgnore')
			.addClass('RESPopupOption')
			//.addClass('disabled')
			.text('ignore')
			//.on('click', modules['userTagger'].ignoreUser(username.toLowerCase(), false));
		popupOptions.appendChild(ignoreToggle[0]).insertAdjacentHTML('afterEnd', ' ');
		
		deeplinks.empty();
		
		deeplinks.append($('<li><a href="/user/'+ username +'/comments">comments</a></li>'));
		deeplinks.append($('<li><a href="/user/'+ username +'/submitted">submitted</a></li>'));
		deeplinks.append($('<li><a href="/user/'+ username +'/gilded">gilded</a></li>'));
		
		// try to load from the cache first.
		username = username.toLowerCase();
		if (typeof modules['userInfo'].userInfoCache[username] !== 'undefined') {
			modules['userInfo'].writeUserInfo(modules['userInfo'].userInfoCache[username], deferredReady);
		} else {
			BrowserStrategy.ajax({
				method: 'GET',
				url: location.protocol + '//' + location.hostname + '/user/' + username + '/about.json?app=res',
				onload: function(response) {
					var thisResponse = safeJSON.parse(response.responseText, null, true);
					modules['userInfo'].updateCache(username, thisResponse);
					modules['userInfo'].writeUserInfo(thisResponse, deferredReady);
				}
			});
		}
	};
	module.updateCache = function(username, data) {
	username = username.toLowerCase();
		if (!data.data) {
			data = {
				data: data
			};
		}
		modules['userInfo'].userInfoCache = modules['userInfo'].userInfoCache || [];
		modules['userInfo'].userInfoCache[username] = $.extend(true, {}, modules['userInfo'].userInfoCache[username], data);
	};
	module.writeUserInfo = function(jsonData, deferred) {
		var d = jsonData.data;
		var popup = document.querySelector('.RESPopup-user');
		var karma = popup.querySelector('.RESPopupKarma');
		var deeplinks = popup.querySelector('.RESPopupDeeplinks');
		var options = popup.querySelector('.RESPopupOptions');
		var about = popup.querySelector('.RESPopupAbout');
		var actions = popup.querySelector('.RESPopupActions');
		var date = popup.querySelector('.RESPopupDate abbr');
		var hasGold = $('<span class="RESPopupHasGold" title="has reddit gold"></span>');
		if (jsonData.error || d.error) {
			karma.innerHTML = '';
			deeplinks.innerHTML = '';
			options.innerHTML = '';
			about.innerHTML = 'User not found.';
			actions.innerHTML = '';
			deferred.resolve($(popup).find('.RESThrobberSml').hide());
			return;
		}
		
		var utctime = d.created_utc;
		var newDate = new Date(utctime * 1000);
		
		karma.querySelector(':first-child').innerText = RESUtils.addCommas(d.link_karma);
		karma.querySelector(':last-child').innerText = RESUtils.addCommas(d.comment_karma);
		date.innerText = RESUtils.niceDateDiff(newDate);
		date.title = 'created on ' + RESUtils.niceDate(newDate, modules['userInfo'].options.USDateFormat.value);
		
		// has gold
		if (d.is_gold) {
			popup.querySelector('.RESPopupExtraInfo').appendChild(hasGold[0]).insertAdjacentHTML('beforeend', ' ');
		}

		// handle friend button
		if (RESUtils.loggedInUser()) {
			var isFriend = !! d.is_friend;
			var isFriendCached = !! modules['userInfo'].userInfoCache[d.name.toLowerCase()].data.is_friend;
			var friendBtn = popup.querySelector('.RESPopupOptions .RESPopupFriendsAdd');
			
			// Data has finished loading by this stage, so remove disabled class.
			friendBtn.classList.remove('disabled');
			
			modules['userInfo'].toggleFriendBtn(friendBtn, d.name, isFriend);
			
			RESUtils.getUserInfo(function(userInfo) {
				var myId = userInfo.data.id;
				if (isFriendCached) {
					friendBtn.setAttribute('onclick', "return toggle(this, unfriend('" + d.name + "', 't2_" + myId + "', 'friend'), friend('" + d.name + "', 't2_" + myId + "', 'friend'))");
				} else {
					friendBtn.setAttribute('onclick', "return toggle(this, friend('" + d.name + "', 't2_" + myId + "', 'friend'), unfriend('" + d.name + "', 't2_" + myId + "', 'friend'))");
				}
				friendBtn.addEventListener('click', function(e) {
					if (isFriendCached) {
						modules['userInfo'].toggleFriendBtn(friendBtn, d.name, false);
					} else {
						modules['userInfo'].toggleFriendBtn(friendBtn, d.name, true);
					}
				}, false);
			});
		}

		// handle highlight button
		if (modules['userTagger'].options.highlightButton.value) {
			var hlBtn = popup.querySelector('.RESPopupOptions .RESPopupHighlight');
			modules['userInfo'].toggleHighlightBtn(hlBtn, d.id);
			hlBtn.addEventListener('click', function(e) {
				modules['userTagger'].toggleUserHighlight(d.id);
				modules['userInfo'].toggleHighlightBtn(hlBtn, d.id);
			}, false);

			hlBtn.classList.remove('disabled');
		}
		
		// handle ignore button
		// ignore function needs rewrite first!
		/*var ignoreBtn = popup.querySelector('.RESPopupOptions .RESPopupIgnore');
		ignoreBtn.classList.remove('disabled');
		if ((modules['userTagger'].tags[d.name]) && (modules['userTagger'].tags[d.name].ignore)) {
			ignoreBtn.classList.add('remove');
			console.log('ignored');
		} else {
			ignoreBtn.classList.remove('remove');
			console.log('not ignored');
		}*/

		deferred.resolve($(popup).find('.RESThrobberSml').hide());
	},
	// Function to change the state of the friend button:
	module.toggleFriendBtn = function(btn, name, isFriend) {
		if (!isFriend) {
			// Update the cache:
			modules['userInfo'].userInfoCache[name.toLowerCase()].data.is_friend = false;
			// Refresh the button:
			btn.textContent = '+ friends';
			btn.classList.remove('remove');
		} else {
			modules['userInfo'].userInfoCache[name.toLowerCase()].data.is_friend = true;
			btn.textContent = '- friends';
			btn.classList.add('remove');
		}
	},
	module.toggleHighlightBtn = function(btn, id) {
		if (!modules['userTagger'].highlightedUsers || !modules['userTagger'].highlightedUsers[id]) {
			btn.textContent = '+highlight';
			btn.classList.remove('remove');
		} else {
			btn.textContent = '-highlight';
			btn.classList.add('remove');
		}
	}
});