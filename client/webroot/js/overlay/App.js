(function (y4) {
	//"use strict";

	y4.App = Backbone.View.extend({
		events: {
			"touchstart body": "touch",
			"mousemove body": "touch"
		},

		initialize: function () {
			this.adverts = new y4.Adverts();
			this.height = $(window).innerHeight() || $(top).innerHeight();
		},
		render: function (width, height) {
			$("body").css({
					"font-size": Math.round(this.height / 15) + "px"
				}).html('<div class="overlay-container"></div>')
				.find(".overlay-container").css({
					position: "relative",
					margin: "0 auto",
					width: width,
					height: height
				}).html(this.advert.get("overlay"));
			return this;
		},
		start: function () {
			var that = this;
			this.adverts.add({ id: Number(window.location.hash.substr(1)) });
			this.advert = this.adverts.first();

			var dfd = this.advert.fetch();	
			window.initOverlay = function (width, height) {
				dfd.done(function () {
					var f = width / height,
					 	h = that.height;

					that.render(f*h, h);
				}).fail(function () {
					$("body").html("No advert with that ID.");
				});
			}
			return this;
		},
		touch: function(e) {
			$(top).trigger(e);
		}
	});

} (this.y4));
