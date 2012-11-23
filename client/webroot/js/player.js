
(function(y4) {
	//"use strict";

	y4.PlayerView = Backbone.View.extend({
		className: "player",
		initialize: function (options) {
			var that = this,
				VideoLayer = y4.useHtmlVideo ? y4.HtmlVideoLayerView : y4.FlashVideoLayerView;
			this.videoLayer = new VideoLayer({ server: options.server });
			this.blackLayer = new y4.BlackLayerView();
			this.stillLayer = new y4.StillLayerView();
			this.skipLayer = new y4.SkipLayerView();
			this.overlayLayer = new y4.OverlayLayerView();
			this.channels = new y4.Channels();

			this.videoLayer.on("set", function () {
				that.videoLayer.show();
			}).on("start", function () {
				that.blackLayer.hide();
			}).on("finish", function () {
				that.blackLayer.show();
				that.videoLayer.hide();
				that.skipLayer.hide();
				that.overlayLayer.hide();
			});
			this.stillLayer.on("set", function () {
				that.stillLayer.show();
			}).on("start", function () {
				that.blackLayer.hide();
			}).on("finish", function () {
				that.blackLayer.show();
				that.stillLayer.hide();
				that.skipLayer.hide();
				that.overlayLayer.hide();
			});
			this.skipLayer.on("skip", function (o) {
				console.log("Skipped - ", o)
			});

		},

		load: function () {
			return this.channels.fetch();
		},
		render: function () {
			this.$el.html("").append(
				this.videoLayer.render().el,
				this.blackLayer.render().el,
				this.stillLayer.render().hide().el,
				this.skipLayer.render().hide().el,
				this.overlayLayer.render().show().el);
			return this;
		},

		setPlaylist: function (playlist) {
			if (this.playlistView) {
				this.playlistView.close();// TODO
			}
			this.playlistView = new y4.PlaylistView({ playlist: playlist });
			$(".playlist-container").html("").append(this.playlistView.render().el);
		},

		setAdvert: function (advert) {
			switch (advert.get("type")) {
			case "still":
				this.stillLayer.set(advert.get("url"));
				break;
			case "video":
				this.videoLayer.set("vod", advert.get("url"));
				break;
			}
			this.overlayLayer.set("http://your4.tv/overlay.php#" + advert.id)
			this.skipLayer.showAfterDelay();
		},
		setBroadcast: function (broadcast) {
			var channel = this.channels.get(broadcast.get("channel_id"));
			this.videoLayer.set("your4", channel.get("url"));
		},

		setProgramme: function (programme) {
			this.videoLayer.set("vod", programme.get("url"));
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
			console.log("http://" + this.options.server + "/" + service + "/" + url + "/playlist.m3u8");
			if (this.url === url && this.service == service) { return; }
			var that = this;
			this.url = url;
			this.$video.attr("src", "http://" + this.options.server + "/" + service + "/" + url + "/playlist.m3u8");
			this.videoEl.load();
			this.play();
			return this;
		},
		render: function () {
			LayerView.prototype.render.call(this);

			var that = this,
				template = _.template($("#html-video-template").html());

			this.$el.html(template(this.options));
			this.$video = this.$("video");
			this.videoEl = this.$video[0];

			this.$video.on("play", function () {
				that.trigger("start");
			}).on("ended", function () {
				that.trigger("finish");
			});

			return this;
		}
	});

	y4.FlashVideoLayerView = VideoLayerView.extend({
		play: function () { console.log("TODO") },
		stop: function () { console.log("TODO") },
		set: function (service, url) {
			console.log('rtmp://' + this.options.server + '/' + service, url);
			// Is there no need to change channel
			if (this.url === url && this.service === "y4") { return; }
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
			this.$("iframe").attr("src", url);
			return this;
		},
		render: function () {
			LayerView.prototype.render.call(this);
			this.$el.html(y4.templates["overlay-layer"]);
			return this;
		}
	});

	y4.SkipLayerView = LayerView.extend({
		className: "layer-view skip-layer",
		zIndex: 5,
		events: {
			"click .skip": "showReasons",
			"touchstart .skip": "showReasons",
			"click .reason": "skip",
			"touchstart .reason": "skip"
		},
		render: function () {
			LayerView.prototype.render.call(this);
			this.$el.html(y4.templates["skip-layer"]);
			return this;
		},
		showReasons: function () {
			this.$(".reasons").show();
		},
		skip: function () {
			this.trigger("skip", {
				reason: "",
				time: ""
			});
		},
		showAfterDelay: function () {
			var that = this;
			setTimeout(function () {
				that.show();
			}, 2000);
		}
	})

	y4.PlaylistView = Backbone.View.extend({
		className: "playlist",
		initialize: function (options) {
			var that = this;
			this.playlist = options.playlist;
			this.playlist.on("add", this.addItem, this);
			this.playlist.on("remove", this.removeItem, this);
			this.itemViews = {};
			this.updateTimer = setInterval(function () {
				that.updateItemViews();
			}, 1000);
		},
		render: function () {
			this.$el.html('<div class="now-line"></div>');
			return this;
		},
		close: function () {
			clearTimeout(this.updateTimer);
			this.off();
			this.remove();
			return this;
		},
		removeItem: function (item) {
			this.itemViews[item.cid].close();
		},
		addItem: function (item) {
			var view = new y4.PlaylistItemView({ item: item });
			this.itemViews[item.cid] = view;
			this.$el.append(view.render().el);
		},
		updateItemViews: function () {
			_.each(this.itemViews, function (view) {
				view.update();
			});
		}
	});

	y4.PlaylistItemView = Backbone.View.extend({
		className: "playlist-item",
		initialize: function (options) {
			this.item = options.item;
			this.item.on("change", this.render, this);
		},
		close: function () {
			this.off();
			this.remove();
			this.item.off("change", this.render);
			return this;
		},
		render: function () {
			console.log(this.item.get("type"))
			this.$el.html(y4.templates["playlist-item"](_.extend({
				duration: this.item.duration(),
				title: this.item.title(),
				thumbnail: this.item.thumbnail()
			}, this.item.toJSON())));
			return this.update();
		},
		update: function () {
			this.$el.css({
				backgroundColor: this.item.get("type") === "adbreak" ? "#FFB917" : "#333",
				left: (this.item.localTime() - y4.now()) / 100 + "%",
				width: this.item.duration() / 100 + "%"
			});
			return this;
		}
	});


}(this.y4));
