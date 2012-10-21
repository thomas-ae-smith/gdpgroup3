(function (y4) {
	"use strict";

	var channelData = [
		{ id: "c4", title: "Channel 4", service: "your4", url: "c4.stream", icon: "img/ids/c4.svg" },
		{ id: "e4", title: "E4", service: "your4", url: "e4.stream", icon: "img/ids/e4.svg" },
		{ id: "m4", title: "More4", service: "your4", url: "m4.stream", icon: "img/ids/more4.svg" },
		{ id: "f4", title: "Film4", service: "your4", url: "film4.stream", icon: "img/ids/film4.svg" },
		{ id: "4music", title: "4music", service: "your4", url: "4music.stream", icon: "img/ids/4music.svg" },
		{ id: "stv", title: "studentTV", service: "your4", url: "studentTV.stream", icon: "img/ids/studenttv.svg" }
	];

	var advertData = [
		{ id: "guinness", type: "video", service: "vod", url: "ad-guinness.mp4" },
		{ id: "gocompare", type: "video", service: "vod", url: "ad-gocompare.mp4" },
		{ id: "justdance", type: "video", service: "vod", url: "ad-justdance.mp4" },
		{ id: "nightlife-sloth", type: "still", image: "img/nightlife-sloth.jpg", duration: 3000 },
		{ id: "your4-sting", type: "still", image: "img/logo-frame.png", duration: 1000 }
	];

	var vodData = [
		{ id: "sample", title: "Sample", service: "vod", url: "sample.mp4" }
	];

	y4.AdvertModel = Backbone.Model.extend({
		scene: function () {
			var mj = this.toJSON(),
				media;
			if (mj.type === "video") {
				media = new y4.Video({ service: mj.service, url: mj.url });
			} else if (mj.type === "still") {
				media = new y4.Still({ image: mj.image, duration: mj.duration  });
			} else {
				y4.error("Invalid advert type");
			}
			return new y4.Advert({
				id: mj.id,
				player: this.collection.player,
				media: media,
				overlay: null
			});
		}
	});
	y4.ProgrammeModel = Backbone.Model.extend({
		scene: function () {
			var that = this,
				mj = this.toJSON();
			return new this.Scene({
				id: mj.id,
				title: mj.title,
				player: that.collection.player,
				media: new y4.Video({
					service: mj.service,
					url: mj.url
				})
			});
		}
	});
	y4.ChannelModel = y4.ProgrammeModel.extend({
		Scene: y4.Channel,
	});
	y4.VODModel = y4.ProgrammeModel.extend({
		Scene: y4.VOD
	});

	y4.AdvertCollection = Backbone.Collection.extend({
		model: y4.AdvertModel,
		initialize: function (models, options) {
			this.player = options.player;
			this.reset(advertData);
			//this.user = options.user;
		},
		advert: function (duration) {
			// TODO Query to advert recommender with duration + this.user.preferences
			return this.at(Math.floor(this.length * Math.random()));
		}
	});

	y4.ProgrammeCollection = Backbone.Collection.extend({
		model: y4.ProgrammeModel,
		initialize: function (models, options) {
			this.channelCollection = options.channelCollection;
			this.vodCollection = options.vodCollection;
		},
		programme: function () {
			// TODO Query programme recommender
			var i = Math.random();
			if (i < 0.7) {
				return this.channelCollection.at(Math.floor(this.channelCollection.length * Math.random()));
			} else {
				return this.vodCollection.at(Math.floor(this.vodCollection.length * Math.random()));
			}
		}
	});

	y4.ChannelCollection = Backbone.Collection.extend({
		model: y4.ChannelModel,
		initialize: function (models, options) {
			this.player = options.player;
			this.reset(channelData);
		}
	});

	y4.VODCollection = Backbone.Collection.extend({
		model: y4.VODModel,
		initialize: function (models, options) {
			this.player = options.player;
			this.reset(vodData);
		}
	});

}(this.y4));
