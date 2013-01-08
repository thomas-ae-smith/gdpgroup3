(function (y4, $, Backbone, _, $f) {
	//"use strict";

	y4.RatingView = Backbone.View.extend({
		className: "rating",
		initialize: function () {
			var that = this,
				programmes = new y4.Programmes([ { id: this.options.programmeId } ]);
			this.programme = programmes.first();
			console.log("Koooo", that.options.programmeId);
			this.programme.fetch().done(function () {
				console.log("2: CHEE", that.programme);
				that.render();
			});
		},
		render: function () {
			var that = this;
			this.$el.html("");
			_.times(5, function (i) {
				var $star = $('<div class="star">O</div>');
				$star.click(function (e) {
					e.preventDefault();
					that.rate((i - 2) / 2).then(function () {
						$star.html("X").siblings().html("O");
					});
				});
				that.$el.append($star);
			});
			
			var skip = $('<a href="javascript:;" class="skip" style="bottom: 20px;">Skip</a>');
			this.$el.append(skip);

			return this;
		},
		rate: function (i) {
			return this.programme.rate(i);
		}
	});

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
			this.transcriptLayer = new y4.TranscriptLayerView();
			this.channels = new y4.Channels();

			this.videoLayer.on("set", function () {
				that.videoLayer.show();
			}).on("start", function (metaData) {
				that.blackLayer.hide();
				that.transcriptLayer.start();
				var w = that.overlayLayer.$("iframe")[0].contentWindow;
				setInterval(function () {
					try {
						w.initOverlay(metaData.width, metaData.height);
					} catch (e) {}
				}, 500); /// FIXME: HORRIBLE HACK

			}).on("finish", function () {
				//that.blackLayer.show();
				//that.videoLayer.hide();
				that.skipLayer.hide();
				that.overlayLayer.hide();
				that.transcriptLayer.reset();
			});
			this.stillLayer.on("set", function () {
				that.stillLayer.show();
			}).on("start", function () {
				that.blackLayer.hide();
			}).on("finish", function () {
				//that.blackLayer.show();
				that.stillLayer.hide();
				that.skipLayer.hide();
				that.overlayLayer.hide();
			});
			this.skipLayer.on("skip", function (o) {
				console.log("Skipped - ", o);
			});

		},

		load: function () {
			return this.channels.fetch();
		},
		render: function () {
			this.$el.html("").append(this.videoLayer.el, this.blackLayer.render().el);
			this.videoLayer.render(true).$el.append(this.transcriptLayer.el);
			this.transcriptLayer.render().$el.append(this.stillLayer.el);
			this.stillLayer.render().$el.append(this.overlayLayer.render().el);

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
			this.overlayLayer.set("http://" + window.location.host + window.location.pathname.split("/").slice(0, -1).join("/") + "/overlay.php?" + Math.floor(Math.random() * 100000000) + "#" + advert.id).show();
			this.skipLayer.showAfterDelay();
		},
		setBroadcast: function (broadcast) {
			var channel = this.channels.get(broadcast.get("channel_id"));
			this.videoLayer.set("your4", channel.get("url"));
			var ratingView = new y4.RatingView({ programmeId: broadcast.get("programme_id") });
			$(".rating-container").html("").append(ratingView.render().el);
		},

		setProgramme: function (programme) {
			this.videoLayer.set("vod", "prog-" + programme.get("uid")/*programme.get("url")*/, y4.startTimeHack );
			if (programme.get("transcript")) {
				this.transcriptLayer.set(programme.get("transcript")).show();
			}
			var ratingView = new y4.RatingView({ programmeId: programme.id });
			console.log("J", ratingView, $(".rating-container"));
			$(".rating-container").html("").append(ratingView.render().el);
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
			if (this.url === url && this.service === service) { return; }
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
				var metaData = {};
				metaData.width = this.videoWidth;
				metaData.height = this.videoHeight;
				that.trigger("start", metaData);
			}).on("ended", function () {
				that.trigger("finish");
			});

			return this;
		}
	});

	y4.FlashVideoLayerView = VideoLayerView.extend({
		play: function () { this.$f.play(); },
		pause: function () { this.$f.pause(); },
		set: function (service, url, startTime) {
			console.log('rtmp://' + this.options.server + '/' + service, url);
			// Is there no need to change channel
			if (this.url === url && this.service === "y4") { return; }
			this.service = service;
			this.url = url;
			this.startTime = startTime || 0;
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
					start: this.startTime,
					provider: 'y4',
					autoPlay: true,
					autoBuffering: true,
					accelerated: true,
					onStart: function () {
						that.trigger("start", that.$f.getClip().metaData);
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
			this.$f = $f(this.$('.flash-video-container')[0]);

			return this;
		}
	});

	y4.BlackLayerView = LayerView.extend({
		className: "layer-view black-layer"
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

	y4.TranscriptLayerView = LayerView.extend({
		className: "layer-view transcript-layer",
		initialize: function () {
			this.timers = [];
		},
		set: function (transcript) {
			this.reset();
			this.transcript = transcript;
			return this;
		},
		start: function () {
			var that = this;
			_.each(this.transcript, function (subtitle) {
				that.timers.push(setTimeout(function () {
					that.subtitle(subtitle.msg, subtitle.duration);
				}, subtitle.time * 1000));
			});
			return this;
		},
		reset: function () {
			delete this.transcript;
			_.each(this.timers, function (timer) {
				clearTimeout(timer);
			});
		},
		subtitle: function (msg, duration) {
			var that = this;
			that.$subtitle.html(msg);
			setTimeout(function () {
				if (that.$subtitle.html() === msg) {
					that.$subtitle.html("");
				}
			}, duration * 1000);
		},
		render: function () {
			LayerView.prototype.render.call(this);
			this.$el.html('<div class="subtitle"></div>');
			this.$subtitle = this.$(".subtitle");
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
	});

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

}(this.y4, this.jQuery, this.Backbone, this._, this.$f));
