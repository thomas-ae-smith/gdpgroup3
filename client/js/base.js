function htmlEscape(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

(function(root) {
	"use strict";

	var useHtmlVideo = navigator.userAgent.match(/iPad/i) != null;

	var App = Backbone.View.extend({
		events: {
			"mousemove": "showOverlay",
			"touchstart": "showOverlay",
			"click .start-screen": "start",
			"touchstart .start-screen": "start",
			"click .icon-play": "play",
			"click .icon-stop": "stop"
		},
		initialize: function (options) {
			var Video = useHtmlVideo ? HtmlVideo : FlashVideo;

			// Video displayed to user and video for buffering
			this.video = new Video({ server: options.server });

			_.bindAll(this);
		},
		setChannel: function (channel) {
			if (channel == this.channel) { return; }
			this.channel = channel;
			this.blankFrame(1000);
			this.video.setChannel(channel); 

			return this;
		},

		setPlaylist: function (playlist) {
			var that = this;
			var playItem = function (item) {
				console.log(item);
				switch (item.type) {
					case "channel":
						that.setChannel(item.channel);
						break;
					case "logo-frame":
						that.logoFrame(item.duration + 500);
						var switched = false;
						// Prepare next channel
						_.each(playlist, function (item) {
							if (switched || item.type !== "channel") { return; }
							that.setChannel(item.channel);
							switched = true;
						})
						break;
					case "advert":
						that.messageFrame(item.advert, item.duration + 500);
						break;
				}
				setTimeout(function () {
					if (playlist.length > 0) {
						playItem(playlist.shift());
					}
				}, item.duration);
			}

			playItem(playlist.shift());
		},

		off: function () {
			this.setChannel({ url: "" });
		},

		stillFrame: function (url, duration) {
			var $frame = $('<div class="blank-frame"><img src="' + url + '"></div>');
			this.$(".player").append($frame);
			setTimeout(function () {
				$frame.remove();
			}, duration);
		},

		logoFrame: function (duration) {
			var $frame = $('<div class="blank-frame"><div class="logo-frame"><img src="img/logo-frame.png"></div></div>');
			this.$(".player").append($frame);
			setTimeout(function () {
				$frame.remove();
			}, duration);
		},

		blankFrame: function (duration) {
			var $frame = $('<div class="blank-frame"></div>');
			this.$(".player").append($frame);
			setTimeout(function () {
				$frame.remove();
			}, duration);
		},

		messageFrame: function (msg, duration) {
			var $frame = $('<div class="blank-frame">' + msg + '</div>');
			this.$(".player").append($frame);
			setTimeout(function () {
				$frame.remove();
			}, duration);
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

				var refresh = function () {
					$icon.attr("src", channel.icon + "?" + (new Date()).getTime());
					setTimeout(refresh, 60000);
				}
				setTimeout(refresh, 60000 + i * 5000)
			});
		},

		start: function () {
			var that = this;

			this.$(".start-screen").hide();
			this.video.play();
			this.showOverlay();

			this.trigger("start");
		},

		play: function() {
			this.video.play();
		},

		stop: function() {
			this.video.stop();
		},

		overlayIsShown: false,
		hideOverlayTimeout: null,
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

	var Video = Backbone.View.extend({
		className: "video-container",
		initialize: function (options) {
			this.options = _.extend({
				server: "",
			}, options);
			if (options.channel) { this.setChannel(options.channel, true); }
		}
	});

	var HtmlVideo = Video.extend({
		play: function () {
			this.$("video")[0].play();
		},
		stop: function() {
			this.$("video")[0].pause();
		},
		setChannel: function (channel) {
			var that = this;
			this.$("video").attr("src", "http://" + this.options.server + "/" + channel.url + ".stream/playlist.m3u8");
			this.$("video")[0].load();
			this.play();
			return this;
		},
		render: function () {
			var that = this, 
			template = _.template($("#html-video-template").html());

			this.$el.html(template(this.options));

			return this;
		}
	});

	var FlashVideo = Video.extend({
		play: function () {
			console.log("TODO")
		},
		stop: function () {
			console.log("TODO")
		},
		setChannel: function (channel) {
			this.url = channel.url;
			this.render();
			return this;
		},
		render: function () {
			var template = _.template($("#flash-video-template").html());

			this.$el.html(template({
				config: {
					clip: {
						url: this.url + ".stream",
						provider: 'rtmp',
						autoPlay: true
					},
					plugins: {
						rtmp: {
							url: 'lib/flowplayer.rtmp.swf',
							netConnectionUrl: 'rtmp://' + this.options.server
						},
						controls: null
					},
					canvas: {
						background: '#ff0000',
						backgroundGradient: 'none'
					}
				}
			}));

			return this;
		}
	});

	var channels = {
		"c4": { title: "Channel 4", icon: "http://nrg.project4.tv/c4_90$", thumbnail: "http://nrg.project4.tv/c4_480$", url: "c4" },
		"e4": { title: "E4", icon: "http://nrg.project4.tv/e4_90$", thumbnail: "http://nrg.project4.tv/e4_480$", url: "e4" },
		"m4": { title: "More4", icon: "http://nrg.project4.tv/m4_90$", thumbnail: "http://nrg.project4.tv/m4_480$", url: "m4" },
		"f4": { title: "Film4", icon: "http://nrg.project4.tv/f4_90$", thumbnail: "http://nrg.project4.tv/f4_480$", url: "film4" },
		"4music": { title: "4Music", icon: "http://nrg.project4.tv/4music_90$", thumbnail: "http://nrg.project4.tv/4music_480$", url: "4music" },
		"stv": { title: "studentTV", icon: "http://nrg.project4.tv/stv_90$", thumbnail: "http://nrg.project4.tv/stv_480$", url: "studentTV" }
	};

	var your4 = root.your4 = new App({
		server: "152.78.144.19:1935/your4",
		channels: channels,
		channelsOrdered: [channels["c4"], channels["e4"], channels["m4"], channels["f4"], channels["4music"], channels["stv"]]
	});

	your4.on("start", function () {
		your4.setPlaylist([
			{ type: "channel", channel: channels.c4, duration: 5000 },
			// Program break -> sponser message, c4 promo ad and channel sting should still be included
			{ type: "logo-frame", duration: 2000 },
			{ type: "advert", advert: "Some advert", duration: 2000 },
			{ type: "advert", advert: "Another advert", duration: 2000 },
			{ type: "advert", advert: "Yet another advert", duration: 2000 },
			{ type: "channel", channel: channels.c4, duration: 10000 }
		]);
	});

	$(document).ready(function () {
		$('#container').html("").append(your4.render().el);
	});

	$(document).on("touchstart", function(e){ 
	    e.preventDefault(); 
	});

})(this);
