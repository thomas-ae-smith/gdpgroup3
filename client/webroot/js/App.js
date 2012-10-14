
(function(y4) {
	"use strict";

	y4.App = Backbone.View.extend({
		events: {
			"mousemove": "showOverlay",
			"touchstart": "showOverlay",
			"click .start-screen": "start",
			"touchstart .start-screen": "start",
			"click .icon-play": "play",
			"click .icon-stop": "stop"
		},
		initialize: function (options) {
			this.player = new y4.Player({ server: options.server });

			_.bindAll(this);
		},

		play: function () { this.player.play(); },
		stop: function () { this.player.stop(); },

		setVideoScene: function (scene, duration) {
			var that = this;
			that.player.blackLayer.show();
			that.player.videoLayer.set(scene).unmute();
			that.player.blackLayer.hide();
			setTimeout(function () {
				that.player.blackLayer.hide();
			}, 1500);

			if (duration) {
				setTimeout(function () {
					that.player.videoLayer.mute().set(null);
					that.player.blackLayer.show();
				}, duration);
			}
		},

		setStillScene: function (scene, duration) {
			var that = this;
			that.player.blackLayer.show();
			that.player.stillLayer.set(scene).show();

			if (duration) {
				setTimeout(function () {
					that.player.stillLayer.hide();
				}, duration);
			}

		},

		setPlaylist: function (_playlist) {
			var that = this,
				playlist = _.clone(_playlist),

				underplay = 2000, // when to start playing before showing - start earlier to give more buffer time
				overplay = 500, // milliseconds longer to play a stream after an advert has shown

				playItem = function (item) {
					var scene = item.scene,
						duration = item.duration,
						i;

					if (scene instanceof y4.VideoScene) {
						that.setVideoScene(scene, duration + overplay);
					} else if (scene instanceof y4.StillScene) {
						that.setStillScene(scene, duration);
						// Iterate through items to find next video scene so that it can buffer
						if (playlist.length && (playlist[0].scene instanceof y4.VideoScene)) {
							setTimeout(function () {
								that.player.videoLayer.mute().set(playlist[0].scene);
							}, item.duration - underplay);
						}
					} else {
						return y4.error("Invalid item");
					}

					if (item.duration) {
						setTimeout(function () {
							if (playlist.length) { playItem(playlist.shift()); }
						}, item.duration);
					}
				};

			playItem(playlist.shift());
		},

		render: function () {
			var that = this,
				playerTemplate = _.template($("#player-template").html());

			this.$el.html(playerTemplate());
			this.renderChannelButtons();
			this.$el.append(this.player.render().el);

			return this;
		},

		renderChannelButtons: function () {
			var that = this,
				$channels = this.$('.channels');

			_.each(this.options.channels, function (channel, i) {
				var $el = $('<a class="channel" href="javascript:;">' +
					'<div>' +
						'<img class="icon" src="' + channel.icon + '">' +
				 		'<span class="title">' + channel.title + '</span>' +
				 	'</div>' +
				 	'</a>'),
					$icon = $el.find(".icon");
				$el.on("click touchstart", function () {
					that.setVideoScene(channel);
				});
				$channels.append($el);

				/*var refresh = function () {
					$icon.attr("src", channel.icon + "?" + (new Date()).getTime());
					setTimeout(refresh, 60000);
				}
				setTimeout(refresh, 60000 + i * 5000)*/
			});
		},

		start: function () {
			var that = this;

			this.$(".start-screen").hide();
			this.player.play();
			this.showOverlay();

			this.trigger("start");
		},

		showOverlay: function () {
			var that = this;
			if (!this.overlayIsShown) {
				this.$(".channels, .controls").fadeIn(200);
				this.overlayIsShown = true;
			}
			clearTimeout(this.hideOverlayTimeout);
			this.hideOverlayTimeout = setTimeout(function () {
				that.hideOverlay();
			}, 1500);
			return this;
		},

		hideOverlay: function () {
			this.$(".channels, .controls").dequeue().fadeOut(200);
			this.overlayIsShown = false;
			return this;
		},

		log: function (msg) {
			this.$(".log").html(msg + "<br>" + this.$(".log").html());
		}
	});
}(this.y4));