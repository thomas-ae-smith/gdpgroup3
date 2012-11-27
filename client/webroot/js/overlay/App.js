(function (y4) {
	//"use strict";

	y4.App = Backbone.View.extend({
		events: {
			"touchstart body": "touch",
			"mousemove body": "touch"
		},

		initialize: function () {
			this.adverts = new y4.Adverts();
			//this.adverts.fetch();
		},
		render: function () {
			$("body").html(this.advert.get("overlay"))
				.css({
					"font-size": Math.round($(window).innerHeight() / 15) + "px"
				});
			return this;
		},
		start: function () {
			var that = this;
			this.adverts.add({ id: Number(window.location.hash.substr(1)) });
			this.advert = this.adverts.first();

			this.advert.fetch().done(function () {
				that.render();
			}).fail(function () {
				$("body").html("No advert with that ID.");
			});
			return this;
		},
		touch: function(e) {
			$(top).trigger(e);
		}
	});

} (this.y4));
