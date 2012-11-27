
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
			/*this.$el.html("").append(this.videoLayer.el);
			this.videoLayer.render(true).$el.append(this.blackLayer.el);
			this.blackLayer.render().$el.append(this.stillLayer.el);
			this.stillLayer.render().$el.append(this.skipLayer.el);
			this.skipLayer.render().$el.append(this.overlayLayer.render().el);*/

			this.$el.html("").append(this.videoLayer.el, this.blackLayer.render().el);
			this.videoLayer.render(true).$el.append(this.stillLayer.el);
			this.stillLayer.render().$el.append(this.skipLayer.el);
			this.skipLayer.render().$el.append(this.overlayLayer.render().el);

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
			this.overlayLayer.set("http://your4.tv/overlay.php#" + advert.id).show();
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
			return this;
		}
	});

	var VideoLayerView = LayerView.extend({
		className: "layer-view video-layer",
		mute: function () {
			console.log("TODO");
			return this;
		},
		unmute: function () {
			console.log("TODO");
			return this;
		},
		render: function() {
			LayerView.prototype.render.call(this);
			this.$el.css({zIndex:1});
		}
	});

	y4.HtmlVideoLayerView = VideoLayerView.extend({
		play: function () { this.videoEl.play(); },
		pause: function() { this.videoEl.pause(); },
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
			VideoLayerView.prototype.render.call(this);

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
		play: function () { $f(this.$('.flash-video-container')[0]).play(); },
		pause: function () { $f(this.$('.flash-video-container')[0]).pause(); },
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
		render: function (clear) {
			VideoLayerView.prototype.render.call(this);
			var that = this,
				template = _.template($("#flash-video-template").html());

			if (clear) {
				this.$el.html(template());
			}

			this.$('.flash-video-container').html("").flowplayer({
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
	});

	y4.StillLayerView = LayerView.extend({
		className: "layer-view still-layer",
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
			this.playlist.on("switched", this.switchTo, this);
			this.itemViews = {};
			this.updateTimer = setInterval(function () {
				that.updateTicker();
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
		switchTo: function (item) {
			var that = this;
			this.currItem = item;
			_.each(this.itemViews, function (view) {
				view.update();
			});
		},
		updateTicker: function () {
			$('.now-line').css({width: (y4.now()-this.currItem.localTime()) / 100 + '%'});
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
			console.log(this.item.get("type"));

			this.$el.html(y4.templates["playlist-item"](_.extend({
				duration: this.item.duration(),
				start: timestampToTime(this.item.localTime()),
				end: timestampToTime(this.item.localTime()+this.item.duration()),
				title: this.item.title(),
				thumbnail: this.item.thumbnail()
			}, this.item.toJSON())));
			return this.update();
		},
		update: function () {
			this.$el.css({
				backgroundColor: this.item.get("type") === "adbreak" ? "#fff" : "#333",
				width: this.item.duration() / 100 + "%"
			});
			
			this.$el.transition({left: (this.item.localTime() - y4.now()) / 100 + "%"});

			return this;
		}
	});


}(this.y4));
