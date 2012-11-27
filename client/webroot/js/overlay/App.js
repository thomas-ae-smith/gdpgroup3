(function (y4) {
	//"use strict";

	y4.App = Backbone.View.extend({
		events: {
			"touchstart body": "touch",
			"mousemove body": "touch"
		},

		initialize: function () {
			this.adverts = new y4.Adverts();
		},
		render: function () {
			console.log($(top).find('.overlay-layer').children());
			$("body").css({
					"font-size": Math.round($(window).innerHeight() / 15) + "px"
				}).html('<div class="overlay-container"></div>')
				.find(".overlay-container").css({
					position: "relative",
					margin: "0 auto",
				}).html(this.advert.get("overlay"));
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

			window.setVideoDimensions = function (width, height) {
				y4.videoWidth = width;
				y4.videoHeight = height;
				var f = width / height,
					h = $(window).innerHeight();

				this.$(".overlay-container").css({
					height: h,
					width: f * h
				});
			}
			return this;
		},
		touch: function(e) {
			$(top).trigger(e);
		}
	});

} (this.y4));
