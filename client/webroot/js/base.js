(function (root) {
	//"use strict";

	var htmlVideoBrowsers = ['iPad'];

	var y4 = root.y4 = {
		templates: {},
		pages: {},
		cacheTemplates: function () {
			_.each($("#templates > script"), function (el) {
				var $el = $(el);
				y4.templates[$el.attr("id").replace("-template", "")] = _.template($el.html());
			});
		},
	};

	if (navigator.userAgent.indexOf("iPad") > -1) {
		y4.browser = "iPad";
	} else {
		y4.browser = "unknown";
	}

	// Should HTML5 videos be used?
	y4.useHtmlVideo = htmlVideoBrowsers.indexOf(y4.browser) > -1;

}(this));
