(function(y4) {
	"use strict";
	
	y4.Media = Backbone.View.extend({

	});

	y4.Video = y4.Media.extend({
		initialize: function (options) {
			options = _.extend({}, options);
			y4.Scene.prototype.initialize.apply(this, arguments);
			this.video = options.video;
			this.url = options.url;
			this.service = options.service;
		}
	});

	y4.Still = y4.Media.extend({
		className: "still-frame",
		initialize: function (options) {
			options = _.extend({}, options);
			y4.Scene.prototype.initialize.apply(this, arguments);
			this.text = options.text;
			this.image = options.image;
			this.duration = options
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
		}
	});

}(this.y4);