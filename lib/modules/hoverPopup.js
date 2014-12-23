addModule('hoverPopup', function(module, moduleID) {
	module.moduleName = 'Hover Pop-up Behaviour';
	module.category = 'My Modules';
	module.description = 'Applies to pop-ups for <em>user info</em>, <em>subreddit info</em> and <em>parent comments</em>.';
	module.options = {
		// Any configurable options go here.
		// Options must have a type and a value..
		// Valid types: text, boolean, color (in hexadecimal form), list
		// For example:
		openDelay: {
			type: 'text',
			value: 0.5,
			description: 'Delay in <em>seconds</em> before a popup opens. Default: 0.5.'
		},
		fadeDelay: {
			description: 'Delay in <em>seconds</em> before a popup closes. Default: 0.2.',
			type: 'text',
			value: 0.2
		},
		fadeSpeed: {
			description: 'Speed in <em>seconds</em> to fade in or out. Default: 0.3.',
			type: 'text',
			value: 0.3
		},
		width:  {
			description: 'Maximum width in <em>pixels</em> of the popup. Default: 450',
			type: 'text',
			value: 450
		},
		closeOnMouseOut: {
			description: 'Automatically close the popup when you leave it. Default: on.',
			type: 'boolean',
			value: true
		}
	};
	module.include = [
		'profile',
		/^https?:\/\/([a-z]+)\.reddit\.com\/message\/comments\/[-\w\.]+/i
	];

	module.go = function() {
		if ((module.isEnabled()) && (module.isMatchURL())) {
			console.log('hoverPopup message');
		}
	};
});