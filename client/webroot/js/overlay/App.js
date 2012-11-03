(function (y4) {
	"use strict";

	y4.App = Backbone.View.extend({
		initialize: function () {
			this.adverts = new y4.Adverts();
			//this.adverts.fetch();
		},
		render: function () {
			return this;
		},
		start: function () {
			var advert = this.adverts.get(Number(window.location.hash.substr(1)));
			if (advert) {
				$("body").html(advert.get("overlay"));
			}
			window.update = function (html) {
				console.log("hj", $("body"), html)
				$("body").html(html);
			}
			return this;
		}
	});

} (this.y4));
