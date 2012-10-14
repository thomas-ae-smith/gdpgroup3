
(function(y4) {
	"use strict";

	y4.Player = Backbone.View.extend({
		className: "player",
		initialize: function (options) {
			this.videoLayer = new y4.VideoLayer({ server: options.server });
			this.blackLayer = new y4.BlackLayer();
			this.stillLayer = new y4.StillLayer();
		},
		render: function () {
			this.$el.html("").append(
				this.videoLayer.render().el,
				this.blackLayer.render().el,
				this.stillLayer.render().el);

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
		initialize: function (options) {
			var Video = y4.useHtmlVideo ? y4.HtmlVideo : y4.FlashVideo;
			this.video = new Video({ server: options.server });
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
			this.video.setUrl(scene ? scene.url : "");
			return this;
		},
		render: function () {
			this.$el.html("").append(this.video.render().el);
			return this;
		}
	});

	y4.BlackLayer = Backbone.View.extend({
		className: "black-layer",
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

	y4.StillLayer = y4.BlackLayer.extend({
		className: "still-layer",
		set: function (scene) {
			this.$el.html("").append(scene.render().el);
			return this;
		}
	})

}(this.y4));