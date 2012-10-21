
(function(y4) {
	"use strict";

	y4.VideoPlayer = Backbone.View.extend({
		className: "video-container",
		initialize: function (options) {
			this.options = _.extend({
				server: ""
			}, options);
		}
	});

	y4.HtmlVideoPlayer = y4.VideoPlayer.extend({
		play: function () { this.videoEl.play(); },
		stop: function() { this.videoEl.pause(); },
		setUrl: function (service, url) {
			if (this.url === url && this.service == service) { return; }
			var that = this;
			this.url = url;
			this.$video.attr("src", "http://" + this.options.server + "/" + this.service + "/" + url + "/playlist.m3u8");
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

	y4.FlashVideoPlayer = y4.VideoPlayer.extend({
		play: function () { console.log("TODO") },
		stop: function () { console.log("TODO") },
		setUrl: function (service, url) {
			console.trace();
			if (this.url === url && this.service === service) { return; }
			this.service = service;
			this.url = url;
			console.log("Video: rtmp://" + this.options.server + '/' + this.service + "/" + this.url)
			this.render();
			return this;
		},
		render: function () {
			var template = _.template($("#flash-video-template").html());

			this.$el.html(template({
				config: {
					clip: {
						url: 'mp4:' + this.url,
						provider: 'rtmp',
						autoPlay: true,
						autoBuffering: true,
						accelerated: true,
						onStart: function () {
							that.trigger("started");
						},
						onFinish: function () {
							that.trigger("finished");
						}
					},
					plugins: {
						rtmp: {
							url: 'lib/flowplayer.rtmp.swf',
							netConnectionUrl: 'rtmp://' + this.options.server + '/' + this.service
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