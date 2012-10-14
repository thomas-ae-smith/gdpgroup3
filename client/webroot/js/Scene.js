
(function(y4) {
	"use strict";

	y4.Scene = Backbone.View.extend({
		initialize: function (options) {
			options = _.extend({}, options);
			_.bindAll(this);
		}
	});

	y4.VideoScene = y4.Scene.extend({
		initialize: function (options) {
			options = _.extend({}, options);
			y4.Scene.prototype.initialize.apply(this, arguments);
			this.video = options.video;
			this.url = options.url;
		}
	});

	y4.StillScene = y4.Scene.extend({
		className: "still-frame",
		initialize: function (options) {
			options = _.extend({}, options);
			y4.Scene.prototype.initialize.apply(this, arguments);
			this.text = options.text;
			this.image = options.image;
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


	y4.Channel = y4.VideoScene.extend({
		initialize: function (options) {
			options = _.extend({}, options);
			y4.VideoScene.prototype.initialize.apply(this, arguments);
			this.icon = options.icon;
			this.title = options.title;
		}
	});

	y4.Advert = y4.VideoScene.extend({
		initialize: function (options) {
			options = _.extend({}, options);
			y4.VideoScene.prototype.initialize.apply(this, arguments);
			this.itemNumber = options.itemNumber;
			this.itemCount = options.itemCount;
		}
	});

}(this.y4));