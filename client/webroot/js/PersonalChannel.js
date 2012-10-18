(function (y4) {
	y4.PersonalChannel = Backbone.View.extend({
		initialize: function (options) {
			this.advertCollection = options.advertCollection;
			this.programmeCollection = options.programmeCollection;
			this.player = options.player;
		},

		start: function () {
			var that = this;
			this.adverts(5000).then(function () {
				that.programme();
			});
			
		},

		programme: function () {
			var that = this,
				programme = this.programmeCollection.programme(),
				scene = programme.scene();

			scene.start().on("adsStart", function (duration) {
				scene.stop();
				that.adverts(duration);

			}).on("adsEnd", function () {
				scene.start();

			}).on("programmeEnd", function () {
				scene.destroy();

				that.adverts(60000).then(function () {
					that.programme();
				});
			});
		
			return scene;		
		},

		adverts: function (duration) {
			var that = this,
				dfd = new $.Deferred(),
				endTime = y4.now() + duration,
					
				showAd = function (timeRemaining) {
					that.advert(timeRemaining).on("finish", function () {
						timeRemaining = endTime - y4.now();
						if (timeRemaining > 0) {
							showAd(timeRemaining);
						} else {
							dfd.resolve();
						}
					});
				};
			
			showAd(endTime - y4.now());

			return dfd;
		},

		advert: function (duration) {
			var that = this,
				advert = this.advertCollection.advert(),
				scene = advert.scene();

			scene.start();

			return scene;

		}
	})
}(this.y4));