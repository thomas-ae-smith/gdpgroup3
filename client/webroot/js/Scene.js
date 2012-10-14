
(function(y4) {
	"use strict";

	y4.Scene = Backbone.View.extend({
		initialize: function (options) {
			options = _.extend({}, options);
			this.duration = options.duration;
			this.startTime = (new Date()).getTime();
			setInterval(this.tick, 500);
			_.bindAll(this);
		},
		tick: function () {
			if (!this.duration) { return; }
			var now = y4.now();
			if (now >= this.startTime + this.duration) {
				this.trigger("end");
			}
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
		initialize: function (options) {
			options = _.extend({}, options);
			y4.Scene.prototype.initialize.apply(this, arguments);
			this.text = options.text;
			this.image = options.image;
		},
		render: function () {
			var $el = ('<div class="blank-frame"></div>');

			if (this.image) {
				$el.append('<div class="image-frame"><img src="' + this.image + '"></div>');
			}
			if (this.text) {
				$el.append('<div class="text">' + this.text + '</div>');
			}

			this.$el.html("").append($el);
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