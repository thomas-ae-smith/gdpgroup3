(function (y4) {
	//"use strict";

	y4.App = Backbone.View.extend({
		events {
			"touchstart body": "touch",
			"mousemove body": "touch"
		},

		initialize: function () {
			this.adverts = new y4.Adverts();
			//this.adverts.fetch();
		},
		render: function () {
			return this;
		},
		start: function () {
			this.adverts.add({ id: Number(window.location.hash.substr(1)) });
			var advert = this.adverts.first();
			advert.fetch().done(function () {
				$("body").html(advert.get("overlay"));
			}).fail(function () {
				$("body").html("No advert with that ID.");
			});
			window.update = function (html) {
				console.log("hj", $("body"), html)
				$("body").html(html);
			}
			return this;
		},
		touch: function(e) {
			$(top).trigger(e);
		}
	});

} (this.y4));
