(function(root) {
	"use strict";

	//var scripts = ["js/Scene.js", "js/collections.js", "js/App.js", "js/VideoPlayer.js", "js/Player.js", "js/Media.js", "js/Overlay.js", "js/PersonalChannel.js"],

	var requires = {
			"all": [],
			"your4": ["apps/Your4"],
			"advertiser": ["apps/Advertiser"],
			"overlay": ["apps/Overlay"]
		},
		styles = ["css/style.css"],
		htmlVideoBrowsers = ["iPad"];


	var y4 = root.y4 = {
		templates: {},
		pages: {},
		cacheTemplates = function () {
			_.each($("#templates > script"), function (el) {
				var $el = $(el);
				y4p.templates[$el.attr("id").replace("-template", "")] = _.template($el.html());
			});
		},
	};

	if (location.href.indexOf("publisher.html") > -1) {
		y4.site = "advertiser";
	} else if (location.href.indexOf("overlay.html") > -1) {
		y4.site = "overlay";
	} else {
		y4.site = "your4";
	}

	if (navigator.userAgent.indexOf("iPad") > -1) {
		y4.browser = "iPad";
	} else {
		y4.browser = "unknown";
	}

	// Should HTML5 videos be used?
	y4.useHtmlVideo = htmlVideoBrowsers.indexOf(y4.browser) > -1;

	_.each(requires[y4.site], function (script, i) {
		document.write('<script type="text/javascript" src="' + script + '?' + Math.round(Math.random() * 10000000) + '"></script>');
	});
	_.each(styles, function (style) {
		document.write('<link type="text/css" rel="stylesheet" href="' + style + '?' + Math.round(Math.random() * 10000000) + '">');
	});

	// Start the app
	new y4.App();



})(this);
