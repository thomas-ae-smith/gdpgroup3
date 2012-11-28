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
			[49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
			[54, 55, 56, 57, 58, 59, 60, 61, 62, 91]
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
			this.studies = new y4.Studies();
		},
		render: function () {
			var that = this;
			this.$el.html("").append(this.player.render().el);
			this.player.$(".skip").hide();
			if (window.location.hash) {

			} else {
				this.renderScreen("When you're ready to begin, press <i>Start</i>.", function () {
					that.player.videoLayer.trigger("finish")
				});
			}
			return this;
		},
		renderScreen: function (msg, start, replay) {
			var $s = $('<div class="screen"><div class="msg">' + msg + '</div></div>');
			if (start) {
				var $start = $('<input type="button" value="Start">');
				$start.on("click", start).
					on("click", function () {
						$s.remove();
					});

				$s.append($start);
			}
			if (replay) {
				var $replay = $('<input type="button" value="Replay">');
				$replay.on("click", replay).
					on("click", function () {
						$s.remove();
					});
				$s.append($replay);
			}
			this.$el.append($s);
		},
		start: function () {
			var that = this,
				created = $.Deferred();

			this.study = this.studies.create({}, {
				success: function () {
					created.resolve();
				}
			});

			$.when(this.adverts.fetch(), created).done(function () {

				_.each(roundAdvertPools, function (pool, i) {
					that.roundAdverts[i] = new y4.Adverts(that.adverts.filter(function (advert) {
						return pool.indexOf(Number(advert.id)) > -1;
					}));
				})

				that.render();

				var currRound = timeMode,
					roundCount = 0,
					stage = 1; // 1: instructions, 2: round 1, 3: instructions, 4: round 2, 5: instructions, 6: finish

				that.player.videoLayer.on("finish", function () {
					console.log(stage)
					switch (stage) {
					case 1:
						that.player.setProgramme(instructionals[0]);
						stage++;
						break;
					case 2:
					case 5:
						that.renderScreen("When you're ready to begin, press <i>Start</i>.<br>Press <i>Replay</i> to watch these instructions again.", function () {
							stage++;
							that.player.videoLayer.trigger("finish");
						}, function () {
							stage--;
							that.player.videoLayer.trigger("finish");
						});
					case 4:
						that.player.setProgramme(instructionals[1]);
						stage++;
						break;
					case 6:
						that.player.setProgramme(instructionals[2]);
						stage++;
						break;
					case 8:
						that.player.setProgramme(instructionals[3]);
						stage++;
						break;
					case 3:
					case 7:
						var n = Math.floor(Math.random() * that.roundAdverts[currRound].length),
							advert = that.roundAdverts[currRound].at(n);
						that.study.save({
							adverts: that.study.get("adverts").concat([advert.id])
						});
						that.roundAdverts[currRound].remove(advert);
						that.player.setAdvert(advert);
						setTimeout(function () {
							currRound = 1 - currRound;
							roundCount++;
							stage++;
							that.player.videoLayer.trigger("finish");
						}, timeModes[timeMode][roundCount] * 60000);
						
						break;
					}
					
				});

			}).fail(function () {
				$("body").html("Could not fetch adverts.");
			});
			return this;
		}
	});

} (this.y4));
