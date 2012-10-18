
(function(y4) {
	"use strict";

	y4.Player = Backbone.View.extend({
		className: "player",
		initialize: function (options) {
			this.videoLayer = new y4.VideoLayer({ server: options.server });
			this.blackLayer = new y4.BlackLayer();
			this.stillLayer = new y4.StillLayer();
			this.overlayLayer = new y4.OverlayLayer();
		},
		render: function () {
			this.$el.html("").append(
				this.videoLayer.render().el,
				this.blackLayer.render().el,
				this.stillLayer.render().el,
				this.overlayLayer.render().el);

			return this;
		},
		play: function () {
			this.videoLayer.video.play();
		},
		stop: function () {

		}
	});

	y4.VideoLayer = Backbone.View.extend({
		className: "video-layer",
		zIndex: 1,
		initialize: function (options) {
			var VideoPlayer = y4.useHtmlVideo ? y4.HtmlVideoPlayer : y4.FlashVideoPlayer;
			this.video = new VideoPlayer({ server: options.server });
		},
		mute: function () {
			console.log("TODO");
			return this;
		},
		unmute: function () {
			console.log("TODO");
			return this;
		},
		set: function (scene) {
			this.video.setUrl(scene ? scene.service : "", scene ? scene.url : "");
			return this;
		},
		render: function () {
			this.$el.html("").append(this.video.render().el);
			return this;
		}
	});

	y4.StillLayer = y4.BlackLayer.extend({
		className: "still-layer",
		zIndex: 2,
		set: function (scene) {
			this.$el.html("").append(scene.render().el);
			return this;
		}
	});

	y4.OverlayLayer = y4.Layer.extend({
		className: "overlay-layer",
		zIndex: 3,
		set: function (overlay) {
			return this;
		};
	});
	
	y4.BlackLayer = Backbone.View.extend({
		className: "black-layer",
		zIndex: 4,
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

}(this.y4));