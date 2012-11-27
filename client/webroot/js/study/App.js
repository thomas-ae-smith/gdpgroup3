(function (y4) {
	//"use strict";

	var wowzaServer = "152.78.144.19:1935";

	/**** CHANGE THE FOLLOWING BEFORE BEGINNING A STUDY ****/
		
	// 50% of participants should have this as 0, and the remaining as 1
	var firstRound = 0; // 0 or 1
	
	// A third should have this as 0, a third as 1 and a third as 2.
	var timeMode = 0; // 0, 1, or 2

	/*******************************************************/

	var timeModes = [
			[4, 6],
			[5, 5],
			[6, 4]
		],
		roundAdvertPools = [
			[91, 50, 51, 52, 53, 54, 55, 56, 57, 58],
			[54, 55, 56, 57, 58, 59, 60, 61, 62, 63]
		],
		instructionals = [
			new y4.Programme({ url: "WIY-Club2-10_9_1.mp4" }),
			new y4.Programme({ url: "WIY-Club2-10_9_1.mp4" }),
			new y4.Programme({ url: "WIY-Club2-10_9_1.mp4" })
		];

	y4.App = Backbone.View.extend({
		events: {
		},

		initialize: function () {
			this.adverts = new y4.Adverts();
			this.roundAdverts = [];
			this.player = new y4.PlayerView({ server: wowzaServer });
		},
		render: function () {
			this.$el.html("").append(this.player.render().el);
			return this;
		},
		start: function () {
			var that = this;
			this.adverts.fetch().done(function () {

				_.each(roundAdvertPools, function (pool, i) {
					that.roundAdverts[i] = new y4.Adverts(that.adverts.filter(function (advert) {
						return pool.indexOf(Number(advert.id)) > -1;
					}));
				})

				that.render();

				var currRound = timeMode,
					roundCount = 0,
					stage = 2; // 1: instructions, 2: round 1, 3: instructions, 4: round 2, 5: instructions, 6: finish

				that.player.videoLayer.on("finish", function () {
					console.log(stage)
					switch (stage) {
					case 1:
						that.player.setProgramme(instructionals[0]);
						stage++;
						break;
					case 3:
						that.player.setProgramme(instructionals[1]);
						stage++;
						break;
					case 5:
						that.player.setProgramme(instructionals[2]);
						stage++;
						break;
					case 2:
					case 4:
						var n = Math.floor(Math.random() * that.roundAdverts[currRound].length),
							advert = that.roundAdverts[currRound].get(91);
						console.log(n, that.roundAdverts[currRound], advert)
						that.roundAdverts[currRound].remove(advert);
						that.player.setAdvert(advert);
						setTimeout(function () {
							currRound = 1 - currRound;
							roundCount++;
							stage++;
							that.player.trigger("finish");
						}, timeModes[timeMode][roundCount] * 60000);
						break;
					}
					
				}).trigger("finish");

			}).fail(function () {
				$("body").html("Could not fetch adverts.");
			});
			return this;
		}
	});

} (this.y4));
