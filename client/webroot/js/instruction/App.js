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
				position: "relative",
				margin: "200px auto"
			});
			var p = setInterval(function () {
				n += 0.0001;
				that.$el.css({
					width: n * 600,
					height: n * 400,
					marginTop: (1 - n) * 200
				});
			}, 10);
			this.player.$(".skip").hide();
			this.$el.append('<img src="img/retro-tv.png">');
			this.$("img").css({
				position: "absolute",
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				zIndex: 1000
			});
			this.$(".player").css({
				left: "5%",
				right: "22%",
				bottom: "8%",
				top: "8%",
				background: "black"
			});
			$("body").css({ background: "white" });

			return this;
		},
		render1: function () {
			var that = this;
			this.$el.html("").append(this.player.render().el);
			var n = 0.2;
			this.$el.css({
				position: "relative",
				margin: "200px auto"
			});
			var p = setInterval(function () {
				n += 0.001;
				that.$el.css({
					width: n * 600,
					height: n * 400,
					marginTop: (1 - n) * 200
				});
			}, 100);
			this.player.$(".skip").hide();
			this.$el.append('<img src="img/retro-tv.png">');
			this.$("img").css({
				position: "absolute",
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				zIndex: 1000
			});
			this.$(".player").css({
				left: "5%",
				right: "22%",
				bottom: "8%",
				top: "8%",
				background: "black"
			}).find(".video-layer").css({
				opacity: 0
			}).delay(9400).animate({
				opacity: 1
			}, 1000);
			$("body").css({ background: "white" });

			setTimeout(function () {
				clearTimeout(p);
				that.$el.animate({
					left: -1000,
					opacity: 0
				}, 100);
				setTimeout(function () {
					that.$el.html('<img src="img/no-talking.jpg">').css({
						left: 800
					}).animate({
						left: 0,
						opacity: 1
					});
				}, 150);
			}, 19800);
			setTimeout(function () {
				that.$el.animate({
					left: -1000,
					opacity: 0
				}, 100);
				setTimeout(function () {
					that.$el.html('<img src="img/no-phones.png">').css({
						left: 800
					}).animate({
						left: 0,
						opacity: 1
					});
				}, 150);
			}, 22800);
			setTimeout(function () {
				that.$el.fadeOut(1000);
			}, 26200);

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
