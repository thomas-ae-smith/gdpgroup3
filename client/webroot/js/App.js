
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

			this.logoFrame = new y4.StillScene({ image: "img/logo-frame.png" });

			_.bindAll(this);
		},

		setPlaylist: function (_playlist) {
			var that = this,
				playlist = _.clone(_playlist),

				playItem = function (item) {
					var scene = item.scene,
						i;

					if (scene === "logo-frame") {
						scene = that.logoFrame;
					}

					if (scene === "blank-frame") {
						that.player.blankFrame.
					} else if (scene instanceof y4.VideoScene) {
						that.setVideoScene(scene);
					} else if (item.scene instanceof y4.StillScene) {
						that.setStillScene(item.scene, item.duration);
						// Iterate through items to find next video scene so that it can buffer
						for (i = 0; i < playlist.length; i++) {
							if (playlist[i].item instanceof y4.VideoScene) {
								that.setVideoScene(playlist[i]);
								break;
							}
						}
					} else {
						y4.error("Invalid item");
						return;
					}

					if (playlist.length > 0) { 
						item.setDuration(item.duration);
						item.scene.on("end", function () {
							playItem(playlist.shift());
						});
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
					that.setChannel(channel);
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
			this.video.play();
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