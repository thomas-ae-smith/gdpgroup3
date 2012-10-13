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
			"touchstart .start-screen": "start"
		},
		initialize: function (options) {
			var Video = useHtmlVideo ? HtmlVideo : FlashVideo;

			// Video displayed to user and video for buffering
			this.video = new Video({ server: options.server });

			_.bindAll(this);
		},
		setChannel: function (channel) {
			this.channel = channel;
			this.video.setChannel(channel); 

			return this;
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

			setTimeout(function () {
				that.log("Switching to E4...");
				that.setChannel(that.options.channels[1]);
				setTimeout(function () {
					that.log("Switching to nothing...");
					that.off();
					setTimeout(function () {
						that.log("Switching to C4...")
						that.setChannel(that.options.channels[0]);	
					}, 3000)
				}, 3000);
			}, 3000);
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

	root.your4 = new App({
		server: "152.78.144.19:1935/your4",
		channels: [
			{ title: "Channel 4", icon: "http://nrg.project4.tv/c4_90$", thumbnail: "http://nrg.project4.tv/c4_480$", url: "c4" },
			{ title: "E4", icon: "http://nrg.project4.tv/e4_90$", thumbnail: "http://nrg.project4.tv/e4_480$", url: "e4" },
			{ title: "More4", icon: "http://nrg.project4.tv/m4_90$", thumbnail: "http://nrg.project4.tv/m4_480$", url: "m4" },
			{ title: "Film4", icon: "http://nrg.project4.tv/f4_90$", thumbnail: "http://nrg.project4.tv/f4_480$", url: "film4" },
			{ title: "4Music", icon: "http://nrg.project4.tv/4music_90$", thumbnail: "http://nrg.project4.tv/4music_480$", url: "4music" },
			{ title: "studentTV", icon: "http://nrg.project4.tv/stv_90$", thumbnail: "http://nrg.project4.tv/stv_480$", url: "studentTV" }
		]
	});

	$(document).ready(function () {
		$('#container').html("").append(your4.render().el);
		//your4.setChannel(root.your4.options.channels[0])
	});

	$(document).on("touchstart", function(e){ 
	    e.preventDefault(); 
	});

})(this);
