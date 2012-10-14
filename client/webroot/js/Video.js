
(function(y4) {
	"use strict";

	y4.Video = Backbone.View.extend({
		className: "video-container",
		initialize: function (options) {
			this.options = _.extend({
				server: ""
			}, options);
		}
	});

	y4.HtmlVideo = y4.Video.extend({
		play: function () { this.videoEl.play(); },
		stop: function() { this.videoEl.pause(); },
		setUrl: function (url) {
			var that = this;
			this.$video.attr("src", "http://" + this.options.server + "/" + url + ".stream/playlist.m3u8");
			this.videoEl.load();
			this.play();
			return this;
		},
		render: function () {
			var that = this, 
			template = _.template($("#html-video-template").html());

			this.$el.html(template(this.options));
			this.$video = this.$("video");
			this.videoEl = this.$video[0];

			return this;
		}
	});

	y4.FlashVideo = y4.Video.extend({
		play: function () { console.log("TODO") },
		stop: function () { console.log("TODO") },
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