(function(y4) {
	"use strict";

	y4.Scene = Backbone.View.extend({
		initialize: function (options) {
			var that = this;
			console.log(options)

			this.media = options.media;
			this.media.on("start", function () {
				that.trigger("start");
			});

			this.player = options.player;

			_.bindAll(this);
		},
		start: function () {
			if (this.media.type === "video") {
				this.player.setVideoScene(this);
			} else if (this.media.type === "still") {
				this.player.setStillScene(this);
			}
			this.media.start();
			return this;
		}
	});

	y4.Channel = y4.Scene.extend({
		initialize: function (options) {
			y4.Scene.prototype.initialize.apply(this, arguments); // super()

			this.icon = options.icon;
			this.title = options.title;


			// some poll
			// this.trigger("adsStart", duration)
			// this.trigger("adsEnd")
			// this.trigger("programmeEnd")
		}
	});

	y4.VOD =  y4.Scene.extend({
		initialize: function (options) {
			y4.Scene.prototype.initialize.apply(this, arguments); // super()
		}
	});

	y4.Advert = y4.Scene.extend({
		initialize: function (options) {
			var that = this;
			y4.Scene.prototype.initialize.apply(this, arguments); // super()

			this.media.on("finish", function () {
				that.trigger("finish");
				that.remove();
			});

			this.overlay = options.overlay;
		}
	});

}(this.y4));