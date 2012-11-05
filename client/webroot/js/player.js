
(function(y4) {
	"use strict";

	y4.PlayerView = Backbone.View.extend({
		className: "player",
		initialize: function (options) {
			var that = this,
				VideoLayer = y4.useHtmlVideo ? y4.HtmlVideoLayerView : y4.FlashVideoLayerView;
			this.videoLayer = new VideoLayer({ server: options.server });
			this.blackLayer = new y4.BlackLayerView();
			this.stillLayer = new y4.StillLayerView();
			this.overlayLayer = new y4.OverlayLayerView();
			this.channels = new y4.Channels(y4.bootstrap.channels);
			this.videoLayer.on("set", function () {
				that.videoLayer.show();
			}).on("start", function () {
				console.log("JK")
				that.blackLayer.hide();
			}).on("finish", function () {
				that.blackLayer.show();
				that.videoLayer.hide();
			});
			this.stillLayer.on("set", function () {
				that.stillLayer.show();
			}).on("start", function () {
				that.blackLayer.hide();
			}).on("finish", function () {
				that.blackLayer.show();
				that.stillLayer.hide();
			});
		},
		render: function () {
			this.$el.html("").append(
				this.videoLayer.render().el,
				this.blackLayer.render().show().el,
				this.stillLayer.render().el,
				this.overlayLayer.render().el);
			return this;
		},

		setAdvert: function (advert) {
			switch (advert.get("type")) {
			case "still":
				this.stillLayer.set(advert.get("url"));
				break;
			case "video":
				this.videoLayer.set("advert", advert.get("id"));
				break;
			}

		},
		setProgramme: function (programme) {
			console.log(programme.get("live"), programme)
			switch (programme.get("live")) {
			case "live":
				var channel = this.channels.get(programme.get("channel"));
				this.videoLayer.set("your4", channel.get("url"));
				break;
			case "vod":
				this.videoLayer.set("vod", programme.get("uid"));
				break;
			}
		},

		play: function () {
			this.videoLayer.play(); // FIXME: stills?
		},
		stop: function () {

		}
	});

	var LayerView = Backbone.View.extend({
		show: function () {
			this.$el.show();
			return this;
		},
		hide: function () {
			this.$el.hide();
			return this;
		},
		render: function () {
			this.hide();
			return this;
		}
	});

	y4.VideoLayerView = LayerView.extend({
		className: "video-layer",
		zIndex: 1,
		mute: function () {
			console.log("TODO");
			return this;
		},
		unmute: function () {
			console.log("TODO");
			return this;
		}
	});

	y4.HtmlVideoLayerView = y4.VideoLayerView.extend({
		play: function () { this.videoEl.play(); },
		stop: function() { this.videoEl.pause(); },
		set: function (service, url) {
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

			this.hide().$el.html(template(this.options));
			this.$video = this.$("video");
			this.videoEl = this.$video[0];

			return this;
		}
	});

	y4.FlashVideoLayerView = y4.VideoLayerView.extend({
		play: function () { console.log("TODO") },
		stop: function () { console.log("TODO") },
		set: function (service, url) {
			if (this.url === url && this.service === service) { return; }
			this.service = service;
			this.url = url;
			console.log("Video: rtmp://" + this.options.server + '/' + this.service + "/" + this.url)
			this.render();
			this.trigger("set");
			return this;
		},
		render: function () {
			var template = _.template($("#flash-video-template").html());

			this.hide().$el.html(template({
				config: {
					clip: {
						url: 'mp4:' + this.url,
						provider: 'rtmp',
						autoPlay: true,
						autoBuffering: true,
						accelerated: true,
						onStart: function () {
							console.log("HJIO");
							that.trigger("start");
						},
						onFinish: function () {
							that.trigger("finish");
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

	y4.BlackLayerView = LayerView.extend({
		className: "black-layer",
		zIndex: 4
	});

	y4.StillLayerView = LayerView.extend({
		className: "still-layer",
		zIndex: 2,
		set: function (url) {
			this.$("img.still").attr("src", url);
			return this;
		},
		render: function () {
			this.hide().$el.html(templates["still-layer"]);
			return this;
		}
	});

	y4.OverlayLayerView = LayerView.extend({
		className: "overlay-layer",
		zIndex: 3,
		set: function (url) {
			this.$("iframe").attr("href", url);
			return this;
		}
	});


}(this.y4));
