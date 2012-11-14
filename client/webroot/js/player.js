
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
			this.channels = new y4.Channels();

			this.videoLayer.on("set", function () {
				//that.videoLayer.show();
			}).on("start", function () {
				that.blackLayer.hide();
			}).on("finish", function () {
				that.blackLayer.show();
				//that.videoLayer.hide();
			});
			/*this.stillLayer.on("set", function () {
				that.stillLayer.show();
			}).on("start", function () {
				that.blackLayer.hide();
			}).on("finish", function () {
				that.blackLayer.show();
				that.stillLayer.hide();
			});*/

		},

		load: function () {
			return this.channels.fetch();
		},
		render: function () {
			this.$el.html("").append(
				this.videoLayer.render().el,
				this.blackLayer.render().el,
				this.stillLayer.render().hide().el,
				this.overlayLayer.render().show().el);
			return this;
		},

		setAdvert: function (advert) {
			console.log("Play advert", advert)
			switch (advert.get("type")) {
			case "still":
				this.stillLayer.set(advert.get("url"));
				break;
			case "video":
				this.videoLayer.set("vod", advert.get("url"));
				break;
			}
			this.overlayLayer.set("http://your4.tv/overlay.php#" + advert.id)

		},
		setBroadcast: function (broadcast) {
			var programmes = new y4.Programmes([{ id: broadcast.get("programme_id") }]),
				programme = programmes.first(),
				log;
			programme.fetch().done(function () {
				console.log("Programme: " + programme.get("title") + " (" + log + ")");
			});
			switch (Number(broadcast.get("recordState"))) {
			case 0:
			case 1:
				var channel = this.channels.get(broadcast.get("channel_id"));
				this.videoLayer.set("your4", channel.get("url"));
				log = "live on " + channel.get("name");
				break;
			case 2:
				this.videoLayer.set("vod", broadcast.get("uid"));
				log = "on-demand";
				break;
			case 3:
				// Video deleted!!
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
			this.$el.css({ zIndex: this.zIndex });
			return this;
		}
	});

	var VideoLayerView = LayerView.extend({
		className: "layer-view video-layer",
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

	y4.HtmlVideoLayerView = VideoLayerView.extend({
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
			LayerView.prototype.render.call(this);

			template = _.template($("#html-video-template").html());

			this.$el.html(template(this.options));
			this.$video = this.$("video");
			this.videoEl = this.$video[0];

			return this;
		}
	});

	y4.FlashVideoLayerView = VideoLayerView.extend({
		play: function () { console.log("TODO") },
		stop: function () { console.log("TODO") },
		set: function (service, url) {
			console.log('rtmp://' + this.options.server + '/' + service, url);
			if (this.url === url && this.service === service) { return; }
			this.service = service;
			this.url = url;
			this.render();
			this.trigger("set");
			return this;
		},
		render: function () {
			LayerView.prototype.render.call(this);
			var that = this,
				template = _.template($("#flash-video-template").html());

			this.$el.html(template());
			this.$('.flash-video-container').flowplayer({
				src: "lib/flowplayer.swf",
				wmode: "opaque"
			}, {
				clip: {
					url: 'mp4:' + this.url,
					scaling: "fit",
					provider: 'y4',
					autoPlay: true,
					autoBuffering: true,
					accelerated: true,
					onStart: function () {
						that.trigger("start");
					},
					onFinish: function () {
						that.trigger("finish");
					}
				},
				plugins: {
					y4: {
						url: 'lib/flowplayer.rtmp.swf',
						netConnectionUrl: 'rtmp://' + this.options.server + '/' + this.service
					},
					controls: null
				},
				canvas: {
					background: '#ff0000',
					backgroundGradient: 'none'
				}
			});

			return this;
		}
	});

	y4.BlackLayerView = LayerView.extend({
		className: "layer-view black-layer",
		zIndex: 4
	});

	y4.StillLayerView = LayerView.extend({
		className: "layer-view still-layer",
		zIndex: 2,
		set: function (url) {
			this.$("img.still").attr("src", url);
			return this;
		},
		render: function () {
			LayerView.prototype.render.call(this);
			this.$el.html(y4.templates["still-layer"]);
			return this;
		}
	});

	y4.OverlayLayerView = LayerView.extend({
		className: "layer-view overlay-layer",
		zIndex: 3,
		set: function (url) {
			console.log(this.$("iframe"))
			this.$("iframe").attr("src", url);
			return this;
		},
		render: function () {
			LayerView.prototype.render.call(this);
			this.$el.html(y4.templates["overlay-layer"]);
			console.log(y4.templates["overlay-layer"])
			return this;
		}
	});


}(this.y4));
