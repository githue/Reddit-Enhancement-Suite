modules['searchHelper'] = {
	moduleID: 'searchHelper',
	moduleName: 'Search Helper',
	category: 'Posts',
	options: {
		searchSubredditByDefault: {
			type: 'boolean',
			value: true,
			description: 'Search the current subreddit by default when using the search box, instead of all of reddit.'
		},
		addSearchOptions: {
			type: 'boolean',
			value: true,
			description: 'Allow you to choose sorting and time range on the search form of the side panel.'
		},
		legacySearch: {
			type: 'boolean',
			value: false,
			description: 'Request the "legacy layout" feature for reddit search.\n\n<br>This will only be available for a limited time.'
		},
		userFilterBySubreddit: {
			type: 'boolean',
			value: false,
			description: 'When on a user profile, offer to search user\'s post from the subreddit or multireddit we come from.'
		},
		addSubmitButton: {
			type: 'boolean',
			value: false,
			description: 'Add a submit button to the search field.'
		},
		toggleSearchOptions: {
			type: 'boolean',
			value: true,
			description: 'Add a button to hide search options while searching.',
			advanced: true
		},
		hideSearchOptions: {
			type: 'boolean',
			value: false,
			description: 'Automatically hide search options and suggestions on the search page.',
			advanced: true,
			dependsOn: 'toggleSearchOptions'
		},
		searchByFlair: {
			type: 'boolean',
			value: true,
			description: 'When clicking on a post\'s flair, search its subreddit for that flair. <p>May not work in some subreddits that hide the actual flair and add pseudo-flair with CSS (only workaround is to disable subreddit style).</p>'
		},
		searchPageTabs: {
			type: 'boolean',
			value: true,
			description: "Add tabs to the search page for a more compact layout."
		}
	},
	description: 'Provide help with the use of search.',
	isEnabled: function() {
		return RESUtils.options.getModulePrefs(this.moduleID);
	},
	// include: [
	// ],
	isMatchURL: function() {
		// return RESUtils.isMatchURL(this.moduleID);
		return true;
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			var searchExpando;
			if (this.options.searchSubredditByDefault.value) {
				this.searchSubredditByDefault();
			}
			if (this.options.addSearchOptions.value) {
				searchExpando = document.getElementById('searchexpando');
				if (searchExpando) {
					var searchOptionsHtml = '<label>Sort:<select name="sort"><option value="relevance">relevance</option><option value="new">new</option><option value="hot">hot</option><option value="top">top</option><option value="comments">comments</option></select></label> <label>Time:<select name="t"><option value="all">all time</option><option value="hour">this hour</option><option value="day">today</option><option value="week">this week</option><option value="month">this month</option><option value="year">this year</option></select></label>';
					if ($(searchExpando).find('input[name=restrict_sr]').length) { // we don't want to add the new line if we are on the front page
						searchOptionsHtml = '<br />' + searchOptionsHtml;
					}
					$(searchExpando).find('#moresearchinfo').before(searchOptionsHtml);
				}
			}
			if (this.options.legacySearch.value) {
				$('form#search').append('<input type="hidden" name="feature" value="legacy_search" />');
			}
			if (this.options.userFilterBySubreddit.value) {
				var match = location.href.match(RESUtils.regexes.profile);
				if (match !== null) {
					var userProfile = match[1];
					var previousPage;
					if ((match = document.referrer.match(RESUtils.regexes.subreddit)) !== null) {
						previousPage = 'r/' + match[1];
					} else if ((match = document.referrer.match(RESUtils.regexes.multireddit)) !== null) {
						previousPage = match[1];
					}
					if (typeof previousPage !== 'undefined') {
						$('.content[role=main]').prepend('<div class="infobar"><a href="/' + previousPage + '/search?q=author:' + userProfile + ' nsfw:no&restrict_sr=on">Search post of ' + userProfile + ' on /' + previousPage + '</a></div>');
					}
				}
			}
			if (this.options.addSubmitButton.value) {
				searchExpando = document.getElementById('searchexpando');
				if (searchExpando) {
					RESUtils.addCSS('#searchexpando .searchexpando-submit { text-align:center; }');
					var submitDiv = '<div class="searchexpando-submit"><button type="submit">search</button></div>';
					$(searchExpando).append(submitDiv);
				}
			}
			var isLegacySearch = document.querySelector('#siteTable');
			if (this.options.toggleSearchOptions.value && RESUtils.regexes.search.test(location.href) && isLegacySearch) {
				RESUtils.addCSS('.searchpane-toggle-hide { float: right; margin-top: -1em } .searchpane-toggle-show { float: right; } .searchpane-toggle-show:after { content:"\u25BC"; margin-left:2px; }.searchpane-toggle-hide:after { content: "\u25B2"; margin-left: 2px; }');
				if (this.options.hideSearchOptions.value || location.hash === '#res-hide-options') {
					$('body').addClass('res-hide-options');
				}
				RESUtils.addCSS('.res-hide-options .search-summary, .res-hide-options .searchpane, .res-hide-options .searchfacets { display: none; } .res-hide-options .searchpane-toggle-show { display: block; } .searchpane-toggle-show { display: none; }');
				$('.content .searchpane').append('<a href="#res-hide-options" class="searchpane-toggle-hide">hide search options</a>');
				$('.content .searchpane ~ .menuarea').prepend('<a href="#res-show-options" class="searchpane-toggle-show">show search options</a>');
				$('.searchpane-toggle-hide').on('click', function() {
					$('body').addClass('res-hide-options');
				});
				$('.searchpane-toggle-show').on('click', function() {
					$('body').removeClass('res-hide-options');
				});
			}
			if (this.options.searchByFlair) {
				RESUtils.addCSS('.res-flairSearch { cursor: pointer; position: relative; } .linkflairlabel.res-flairSearch a { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }');
				$('#siteTable').on('mouseenter', '.title > .linkflairlabel:not(.res-flairSearch)', function(e) {
					var parent = $(e.target).closest('.thing')[0],
						srMatch = RESUtils.regexes.subreddit.exec(parent.querySelector('.entry a.subreddit')),
						subreddit = (srMatch) ? srMatch[1] : RESUtils.currentSubreddit(),
						flair = e.target.title.replace(/\s/g, '+');
					if (flair && subreddit) {
						var link = document.createElement('a');
						link.href = '/r/' + encodeURIComponent(subreddit) + '/search?sort=new&restrict_sr=on&q=flair%3A' + encodeURIComponent(flair);
						e.target.classList.add('res-flairSearch');
						e.target.appendChild(link);
					}
				});
			}
		}
		// Compact search options into tabs.
		if (this.options.searchPageTabs.value && !isLegacySearch) {
			RESUtils.addCSS('#previoussearch .searchfacets { display: none; border: none; padding: 0; margin: 10px 0 0 0; overflow: visible; }');
			RESUtils.addCSS('#previoussearch .searchfacets h4.title { display: none; }');
			RESUtils.addCSS('#previoussearch .searchfacets ol { padding: 10px 0 0 0; }');
			RESUtils.addCSS('.search-result-listing .res-search-subreddits-header { display: none; }');
			RESUtils.addCSS('ul.res-search-tabs { margin: 10px 0 0 0; padding: 0; list-style: none; clear: left; }');
			RESUtils.addCSS('ul.res-search-tabs li { display: inline-block; margin: 0 2px 0 0; padding: 0; background-color: rgb(240,240,240); }');
			RESUtils.addCSS('ul.res-search-tabs li:last-child { margin-right: none; }');
			RESUtils.addCSS('ul.res-search-tabs li.res-search-tab-active { background-color: transparent; }');
			RESUtils.addCSS('ul.res-search-tabs a { padding: 5px 10px; display: inline-block; }');
			RESUtils.addCSS('.res-search-options, .res-search-subreddits { display: none; }');
			RESUtils.addCSS('.res-search-pane-open { display: block !important; }');
			RESUtils.addCSS('.res-search-subreddits header { display: none; }');
			
			// Variables.
			var searchPanes = RESUtils.createElementWithID('div', '', 'res-search-panes');
			var searchTabsEle = RESUtils.createElementWithID('ul', '', 'res-search-tabs');
			var searchHeader = document.querySelector('#previoussearch');
			var searchForm = document.querySelector('form#search');
			var moreSearchInfoBtn = searchForm.querySelector('#moresearchinfo + p');
			var moreSearchInfo = document.querySelector('#moresearchinfo');
			var searchFacets = document.querySelector('body.search-page .searchfacets');
			//var optionsBtn = RESUtils.createElementWithID('a', '', 'res-search-options-btn');
			var searchOptions = RESUtils.createElementWithID('div', '', 'res-search-options');
			searchForm.removeChild(moreSearchInfoBtn);
			moreSearchInfo = moreSearchInfo.innerHTML;
			//optionsBtn.innerHTML = 'options...';
			$(searchTabsEle).appendTo(searchHeader);

			// Set up tabs
			var searchTabs = {
				'facets' : {
					'label' : 'filter by subreddit',
					'id' : 'facets'
				},
				'subreddits' : {
					'label' : 'subreddits',
					'id' : 'subs'
				},
				'options' : {
					'label' : 'options',
					'id' : 'options'
				}
			};
			console.log(searchTabs);
			
			for (var tab in searchTabs) {
				if (searchTabs.hasOwnProperty(tab)) {
					$('<li>').attr({ class: searchTabs[tab]['id'] }).appendTo(searchTabsEle);
					$('<a>').attr({ href: '#'})
						.text(searchTabs[tab]['label'])
						.appendTo(searchTabsEle.querySelector('li.' + searchTabs[tab]['id']))
						.click(modules['searchHelper'].searchTabClick);
				}
			}
			
			// Set up search panes.
			
			//$(optionsBtn).appendTo(searchHeader);
			$(searchOptions).appendTo(searchHeader);
			if (searchFacets) {
				$(searchFacets).appendTo(searchHeader);
			}
			$(moreSearchInfo).appendTo(searchOptions);
			
			// Collapse the subreddits to bring the links into view.
			var subredditResultListing = document.querySelectorAll('.search-result-listing');
			for (var i = 0; i < subredditResultListing.length; i++) {
				if (subredditResultListing.length > 0) {
					subredditResultListing[0].classList.add('res-search-subreddits');
				}
			}
		}
	},
	searchTabClick: function() {
		var tabID = this.parentNode.classList[0];
		var activeClass = 'res-search-tab-active';
		
		if (this.parentNode.classList.contains(activeClass)) {
			this.parentNode.classList.remove(activeClass);
		} else {
			$('.res-search-tabs li').removeClass(activeClass);
			this.parentNode.classList.add(activeClass);
		}
		
		modules['searchHelper'].searchPaneShow(tabID);
		return false;
	},
	searchPaneShow: function(tabID) {
		var openPane = '';
		switch (tabID) {
			case 'facets':
				console.log('facets');
				openPane = '.searchfacets';
				break;
			case 'subs':
				console.log('subs');
				openPane = '.res-search-subreddits';
				break;
			case 'options':
				console.log('options');
				openPane = '.res-search-options';
				break;
			default:
				console.log('default');
		}
		
		if (document.querySelector(openPane).classList.contains('res-search-pane-open')) {
			openPane.classList.remove('res-search-pane-open');
		} else {
			document.querySelector('.searchfacets').classList.remove('res-search-pane-open');
			document.querySelector('.res-search-subreddits').classList.remove('res-search-pane-open');
			document.querySelector('.res-search-options').classList.remove('res-search-pane-open');
			document.querySelector(openPane).classList.add('res-search-pane-open');
		}
	},
	toggleSearchOptions: function(e) {
		var open = 'res-search-options-open';
		if (this.classList.contains(open)) {
			$(this).next().slideUp(200);
			this.classList.remove(open);
		} else {
			$(this).next().slideDown(200);
			this.classList.add(open);
		}
	},
	toggleSearchFacets: function(e) {
		var open = 'res-search-facets-open';
		if (this.classList.contains(open)) {
			$(this).next().slideUp(200);
			this.classList.remove(open);
		} else {
			$(this).next().slideDown(200);
			this.classList.add(open);
		}
	},
	toggleSubredditResults: function(e) {
		var open = 'res-search-subreddits-open';
		if (this.classList.contains(open)) {
			$(this).next().slideUp(200);
			this.classList.remove(open);
		} else {
			$(this).next().slideDown(200);
			this.classList.add(open);
		}
	},
	searchSubredditByDefault: function() {
		// Reddit now has this feature... but for some reason the box isn't checked by default, so we'll still do that...
		var restrictSearch = document.body.querySelector('INPUT[name=restrict_sr]');
		if (restrictSearch && !document.body.classList.contains('search-page')) { // prevent autochecking after searching with it unchecked
			restrictSearch.checked = true;
		}
	}
};
