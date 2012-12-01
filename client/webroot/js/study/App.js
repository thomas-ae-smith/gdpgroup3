(function (y4, $, Backbone, _) {
	"use strict";

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
			new y4.Programme({ url: "gdp1.mp4", transcript: [
				{ time: 1.24, duration: 4, msg: "Hi, thanks for volunteering for this study." },
				{ time: 4.56, duration: 5, msg: "In this study, we want to find out a bit more about how people view TV adverts." },
				{ time: 9.52, duration: 7, msg: "We're about to show you two sets of adverts." },
				{ time: 12.8, duration: 5, msg: "After these, we'll ask you a series of questions on your experience." },
				{ time: 15.8, duration: 5, msg: "We ask that during this study you remain focused on the screen" },
				{ time: 19.8, duration: 5, msg: "and don't communicate with the researcher (unless there is a problem)" },
				{ time: 22.8, duration: 5, msg: "and please don't use your phone or other devices." },
				{ time: 26.2, duration: 5, msg: "When you're ready to begin, press start." },
				{ time: 27.5, duration: 5, msg: "If you would like to watch this introduction again, press replay." }
			] }),
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

			this.player.videoLayer.on("finish", this.next, this);
		},
		render: function () {
			var that = this;
			this.$el.html("").append(this.player.render().el);
			this.player.$(".skip").hide();
			if (window.location.hash) {
				that.stage = 3;
				var id = Number(window.location.hash.slice(1));
				roundAdvertPools = [[id], [id]];
			} else {
				this.renderScreen("When you're ready to begin, press <i>Start</i>.", function () {
					that.next();
				});
			}
			return this;
		},
		renderScreen: function (msg, start, replay) {
			var $s = $('<div class="screen"><div class="msg">' + msg + '</div></div>');
			if (start) {
				var $start = $('<input type="button" value="Start" class="btn btn-primary">');
				$start.on("click", start).
					on("click", function () {
						$s.remove();
					});

				$s.append($start);
			}
			if (replay) {
				var $replay = $('<input type="button" value="Replay" class="btn">');
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

				that.render();

				_.each(roundAdvertPools, function (pool, i) {
					that.roundAdverts[i] = new y4.Adverts(that.adverts.filter(function (advert) {
						return pool.indexOf(Number(advert.id)) > -1;
					}));
				});

				if (window.location.hash) {
					that.next();
				}

			}).fail(function () {
				$("body").html("Could not fetch adverts.");
			});
			return this;
		},
		stage: 1, // 1: instructions, 2: confirm, 3: round 1, 4: instructions, 5: confirm, 6: round 2, 7: finish
		currRound: timeMode,
		roundCount: 0,
		next: function () {
			var that = this;
			switch (this.stage) {
			case 1:
				that.player.setProgramme(instructionals[0]);
				this.stage++;
				break;
			case 2:
			case 5:
				that.renderScreen("When you're ready to begin, press <i>Start</i>.<br>Press <i>Replay</i> to watch these instructions again.", function () {
					that.stage++;
					that.next();
				}, function () {
					that.stage--;
					that.next();
				});
				break;
			case 4:
				that.player.setProgramme(instructionals[1]);
				that.stage++;
				break;
			case 7:
				that.player.setProgramme(instructionals[2]);
				that.stage++;
				break;
			case 3:
			case 6:
				var n = Math.floor(Math.random() * that.roundAdverts[that.currRound].length),
					advert = that.roundAdverts[that.currRound].at(n);
				that.study.save({
					adverts: that.study.get("adverts").concat([advert.id])
				});
				that.roundAdverts[that.currRound].remove(advert);
				that.player.setAdvert(advert);
				setTimeout(function () {
					that.currRound = 1 - that.currRound;
					that.roundCount++;
					that.stage++;
					that.next();
				}, timeModes[timeMode][that.roundCount] * 60000);

				break;
			}
		}
	});

}(this.y4, this.jQuery, this.Backbone, this._));
