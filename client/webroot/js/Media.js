(function(y4) {
	"use strict";
	
	y4.Media = Backbone.View.extend({

	});

	y4.Video = y4.Media.extend({
		type: "video",
		initialize: function (options) {
			options = _.extend({}, options);
			y4.Media.prototype.initialize.apply(this, arguments);
			this.video = options.video;
			this.url = options.url;
			this.service = options.service;
			//this.video.on("")
		},
		start: function () {}
	});

	y4.Still = y4.Media.extend({
		type: "still",
		className: "still-frame",
		events: {
			"click": "click"
		},
		initialize: function (options) {
			options = _.extend({}, options);
			y4.Media.prototype.initialize.apply(this, arguments);
			this.text = options.text;
			this.image = options.image;
			this.duration = options.duration;
		},
		render: function () {
			this.$el.html("")
			
			if (this.image) {
				this.$el.append('<div class="image-frame"><img src="' + this.image + '"></div>');
			}
			if (this.text) {
				this.$el.append('<div class="text">' + this.text + '</div>');
			}

			return this;
		},
		click: function () {
			//this.trigger("click");
			clearTimeout(this.timeout);
		},
		start: function () {
			var that = this;
			this.timeout = setTimeout(function () {
				that.trigger("finish");
			}, this.duration);
		}
	});

}(this.y4));