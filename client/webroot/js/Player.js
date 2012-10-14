
(function(y4) {
	"use strict";

	y4.Player = Backbone.View.extend({
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

		},
		stop: function () {

		}
	});

	y4.VideoLayer = Backbone.View.extend({
		initialize: function (options) {
			var Video = y4.useHtmlVideo ? y4.HtmlVideo : y4.FlashVideo;
			this.video = new Video({ server: options.server });
		},
		mute: function () { conosle.log("TODO"); },
		unmute: function () { conosle.log("TODO"); },
		set: function (scene) {
			this.video.
		}
	});

	y4.BlackLayer = Backbone.View.extend({
		className: "black-frame",
		show: function () { this.$el.show(); },
		hide: function () { this.$el.hide(); }
		render: function () { return this; }
	});

	y4.StillLayer = BlackLayer.extend({
		className: "black-frame still-frame",
		set: function (scene) {
			this.$el.html("").append(scene.render().el);
		}
	})

}(this.y4));