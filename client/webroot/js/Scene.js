(function(y4) {
	"use strict";

	y4.Scene = Backbone.View.extend({
		initialize: function (options) {
			var that = this;

			this.media = options.media;
			this.media.on("start", function () {
				that.trigger("start");
			});

			_.bindAll(this);
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

	y4.Advert = y4.Scene.extend({
		events: {
			"click": "click"
		},
		initialize: function (options) {
			y4.Scene.prototype.initialize.apply(this, arguments); // super()

			this.media.on("finish", function () {
				that.trigger("finish");
			});

			this.overlay = options.overlay;
		},
		click: function () {
			this.trigger("click");
		}
	});

}(this.y4));