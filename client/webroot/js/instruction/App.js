(function (y4, $, Backbone, _) {
	"use strict";

	var wowzaServer = "152.78.144.19:1935";

	/**** CHANGE THE FOLLOWING BEFORE BEGINNING A STUDY ****/

	// 50% of participants should have this as 0, and the remaining as 1
	var firstRound = 0; // 0 or 1

	// A third should have this as 0, a third as 1 and a third as 2.
	var timeMode = 0; // 0, 1, or 2

	/*******************************************************/

	var roundAdvertPools = [
			[49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
			[54, 55, 56, 57, 58, 59, 60, 61, 62, 91]
		];

	y4.App = Backbone.View.extend({
		events: {
		},

		initialize: function () {
			this.adverts = new y4.Adverts();
			this.player = new y4.PlayerView({ server: wowzaServer });
			this.studies = new y4.Studies();
			this.player.videoLayer.on("finish", this.next, this);
		},
		render: function () {
			var that = this;
			this.$el.html("").append(this.player.render().el);
			var n = 0.2;
			this.$el.css({
				transform: "scale(1)"
			});
			setInterval(function () {
				n += 0.02;
				that.$el.css({
//					transform: "scale(" + n + ")"
				})
			}, 100);
			this.player.$(".skip").hide();
			this.$el.append('<img src="img/tv-retro.png">')
			return this;
		},
		start: function () {
			var that = this;

			this.adverts.fetch().done(function () {

				that.render();

				that.roundAdverts = new y4.Adverts(that.adverts.filter(function (advert) {
					return roundAdvertPools[1].indexOf(Number(advert.id)) > -1;
				}));
				console.log("J", that.roundAdverts)

				that.next();

			}).fail(function () {
				$("body").html("Could not fetch adverts.");
			});
			return this;
		},
		next: function () {
			var n = Math.floor(Math.random() * this.roundAdverts.length),
				advert = this.roundAdverts.at(n);
			this.roundAdverts.remove(advert);
			this.player.setAdvert(advert);

		}
	});

}(this.y4, this.jQuery, this.Backbone, this._));
