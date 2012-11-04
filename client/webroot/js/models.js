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

	var vodData = [
		{ id: "sample", title: "Sample", service: "vod", url: "sample.mp4" }
	];

	// Order by name
	var nameComparator = function (model) {
		return model.get("name").replace(/^the /i, "");
	};

	y4.Occupations = Backbone.Collection.extend({
		url: "http://www.your4.tv/api/occupations/",
		comparator: nameComparator
	});

	y4.Genres = Backbone.Collection.extend({
		url: "http://www.your4.tv/api/genres/",
		comparator: nameComparator
	});


	y4.Programme = Backbone.Model.extend({
		/*scene: function () {
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
		}*/
	});
	y4.Programmes = Backbone.Collection.extend({
		url: "http://www.your4.tv/api/programmes/",
		model: y4.Programme,
		comparator: nameComparator
	});


	y4.Serie = Backbone.Model.extend({

	});
	y4.Series = Backbone.Collection.extend({
		model: y4.Serie
	});


	y4.Advert = Backbone.Model.extend({
		defaults: {
			title: "",
			type: "",
			adverts: [],
			overlay: ""
		},
		// Generate a scene view
		//scene: function () {
		/*	var mj = this.toJSON(),
				media;
			if (mj.type === "video") {
				media = new y4.VideoSceneView({ service: mj.service, url: mj.url });
			} else if (mj.type === "still") {
				media = new y4.StillSceneView({ image: mj.url, duration: mj.duration  });
			} else {
				y4.error("Invalid advert type");
			}
			return new y4.AdvertView({
				id: mj.id,
				player: this.collection.player,
				media: media,
				overlay: null
			});
		}*/
	});
	y4.Adverts = Backbone.Collection.extend({
		url: "http://www.your4.tv/api/adverts/",
		model: y4.Advert
	});


	y4.Campaign = Backbone.Model.extend({
		defaults: {
			title: "",
			startDate: 0,
			endDate: 0,
			adverts: [], // FIXME: WRONG
			targets: { // FIXME: WRONG!!!
				ageRanges: [],
				boundingBoxes: [],
				times: [],
				genres: [],
				occupations: [],
				programmes: [],
				genders: [],
				schedules: []
			}
		},
		initialize: function () {
			var that = this;
			this.targetCollections = {};
			_.each(this.get("targets"), function (targets, type) {
				that.targetCollections[type] = new y4.CampaignTargets(targets, { /*url: that.url() + "/targets/" + type + "/"*/ });
			});
		}
	});
	y4.Campaigns = Backbone.Collection.extend({
		url: "http://www.your4.tv/api/campaigns/",
		model: y4.Campaign
	});

	y4.CampaignTargets = Backbone.Collection.extend({
		initialize: function (items, options) {
			this.url = options.url;
		}
	});



	y4.OccupationModel = Backbone.Model.extend({});

	y4.User = Backbone.Model.extend({
		defaults: {
			facebookId: null,
			name: null,
			email: null,
			gender: null,
			dob: null,
			occupation: null
		}
	});
	y4.Users = Backbone.Collection.extend({
		url: 'http://www.your4.tv/api/users/',
		model: y4.User
	});

	y4.Channels = Backbone.Collection.extend({

	});

	y4.Playlist = Backbone.Model.extend({});
	y4.Playlists = Backbone.Collection.extend({
		url: "http://www.your4.tv/api/playlists/",
		model: y4.Playlist
	});


	/*y4.Channel = y4.ProgrammeModel.extend({
		Scene: y4.Channel,
	});
	y4.VODModel = y4.ProgrammeModel.extend({
		Scene: y4.VOD
	});*/

/*
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
	});*/

}(this.y4));
