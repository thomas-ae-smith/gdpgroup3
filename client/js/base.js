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
		initialize: function (options) {
			this.channel = options.channels[0];
		},
		setChannel: function (channel) {
			this.channel = channel;
			this.video.setUrl(channel.url);
			return this;
		},
		render: function () {
			var that = this,
				playerTemplate = _.template($("#player-template").html());

			this.$el.html(playerTemplate());

			var $channels = this.$('.channels');

			_.each(this.options.channels, function (channel, i) {
				var $el = $('<a class="channel" href="javascript:;">' +
					'<div>' +
						'<img class="icon" src="' + channel.icon + '">' +
				 		'<span class="title">' + channel.title + '</span>' +
				 	'</div>' +
				 	'</a>'),
					$icon = $el.find(".icon");
				$el.click(function () {
					that.setChannel(channel);
				});
				$channels.append($el);

				var refresh = function () {
					$icon.attr("src", channel.icon + "?" + (new Date()).getTime());
					setTimeout(refresh, 60000);
				}
				setTimeout(refresh, 60000 + i * 5000)
			});

			var Video = useHtmlVideo ? HtmlVideo : FlashVideo;

			this.video = new Video({
				server: this.options.server,
				url: this.channel.url
			});

			this.$(".player").append(this.video.render().el);

			this.$el.on("mousemove touchstart touchmove click", function () {
				that.showChannels();
			});

			/*this.$("video").on("mousemove touchstart touchmove click", function () {
				that.showChannels();
			});*/

			setTimeout(function () {
				this.$("video")[0].play();
			}, 2000);

			this.showChannels();

			return this;
		},

		channelsAreShown: false,
		hideChannelsTimeout: null,
		showChannels: function () {
			var that = this;
			if (!this.channelsAreShown) {
				this.$(".channels").fadeIn(200);
				this.channelsAreShown = true;
			}
			clearTimeout(this.hideChannelsTimeout);
			this.hideChannelsTimeout = setTimeout(function () {
				that.hideChannels();
			}, 1500);
			return this;
		},
		hideChannels: function () {
			this.$(".channels").dequeue().fadeOut(200);
			this.channelsAreShown = false;
			return this;
		}
	});

	var HtmlVideo = Backbone.View.extend({
		setUrl: function (url) {
			this.$("source").attr("src", "http://" + this.options.server + "/" + url + "/playlist.m3u8");
			return this;
		},
		render: function () {
			var template = _.template($("#html-video-template").html());

			this.$el.html(template({
				server: this.options.server,
				channel: this.options.url
			}));

			return this;
		}
	});

	var FlashVideo = Backbone.View.extend({
		initialize: function (options) {
			this.server = options.server;
			this.url = options.url;
		},
		setUrl: function (url) {
			this.url = url;
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
							netConnectionUrl: 'rtmp://' + this.server
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

	$(document).ready(function () {

		root.your4 = new App({
			//http://152.78.144.19/your4/e4.stream/playlist.m3u8
			server: "152.78.144.19:1935/your4",
			channels: [
				{ title: "Channel 4", icon: "http://nrg.project4.tv/c4_90$", url: "c4" },
				{ title: "E4", icon: "http://nrg.project4.tv/e4_90$", url: "e4" },
				{ title: "More4", icon: "http://nrg.project4.tv/m4_90$", url: "m4" },
				{ title: "Film4", icon: "http://nrg.project4.tv/f4_90$", url: "film4" },
				{ title: "4Music", icon: "http://nrg.project4.tv/4music_90$", url: "4music" },
				{ title: "studentTV", icon: "http://nrg.project4.tv/stv_90$", url: "studentTV" }
			]
		});

		$('#container').append(your4.render().el);
	});

	$(document).on("touchstart", function(e){ 
	    e.preventDefault(); 
	});

})(this);
