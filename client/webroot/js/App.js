
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
			var Video = y4.useHtmlVideo ? y4.HtmlVideo : y4.FlashVideo;

			this.video = new Video({ server: options.server });

			this.blankFrame = new y4.StillScene();
			this.logoFrame = new y4.StillScene({ image: "img/logo-frame.png" });

			_.bindAll(this);
		},
		setChannel: function (channel) {
			if (channel == this.channel) { return; }
			this.channel = channel;
			this.blankFrame(1000);
			this.video.setChannel(channel); 

			return this;
		},

		setVideoScene: function (scene) {
			this.blankFrame(1000);
			scene.setVideo(this.video);
		},

		setStillScene: function (scene, duration) {
			scene.setDuration(duration);
		},

		setPlaylist: function (_playlist) {
			var that = this,
				playlist = _.clone(playlist),

				playItem = function (item) {
					var scene = item.scene,
						i;

					if (scene === "logo-frame") {
						scene = this.logoFrame;
					} else if (scene === "blank-frame") {
						scene = this.blankFrame;
					}

					if (item.scene instanceof your4.VideoScene) {
						that.setVideoScene(item.scene);
					} else if (item.scene instanceof your4.StillScene) {
						that.setStillScene(item.scene, item.duration);
						// Iterate through items to find next video scene so that it can buffer
						for (i = 0; i < playlist.length; i++) {
							if (playlist[i].item instanceof your4.VideoScene) {
								that.setVideoScene(playlist[i]);
								break;
							}
						}
					} else {
						your4.error("Invalid item");
						return;
					}

					if (playlist.length > 0) { 
						item.setDuration(item.duration);
						item.scene.on("end", function () {
							playItem(playlist.shift());
						});
					}
				}

			playItem(playlist.shift());
		},

		off: function () {
			this.setChannel({ url: "" });
		},

		render: function () {
			var that = this,
				playerTemplate = _.template($("#player-template").html());

			this.$el.html(playerTemplate());
			this.renderChannelButtons();
			this.$(".player").append(this.video.render().el);

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

		play: function() { this.video.play(); },

		stop: function() { this.video.stop(); },

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