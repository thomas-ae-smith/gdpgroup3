
(function(y4) {
	"use strict";

	y4.Video = Backbone.View.extend({
		className: "video-container",
		initialize: function (options) {
			this.options = _.extend({
				server: ""
			}, options);
			if (options.channel) { this.setChannel(options.channel, true); }
		}
	});

	y4.HtmlVideo = y4.Video.extend({
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

	y4.FlashVideo = y4.Video.extend({
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

}(this.y4));