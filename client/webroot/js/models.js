(function (y4) {
	"use strict";
	
	var baseUrl = window.location.hostname;

	y4.bootstrap = {
		channels: [
			{ id: "518974809", title: "Channel 4", service: "your4", url: "c4.stream", icon: "img/ids/c4.svg" },
			{ id: "e4", title: "E4", service: "your4", url: "e4.stream", icon: "img/ids/e4.svg" },
			{ id: "m4", title: "More4", service: "your4", url: "m4.stream", icon: "img/ids/more4.svg" },
			{ id: "f4", title: "Film4", service: "your4", url: "film4.stream", icon: "img/ids/film4.svg" },
			{ id: "4music", title: "4music", service: "your4", url: "4music.stream", icon: "img/ids/4music.svg" },
			{ id: "stv", title: "studentTV", service: "your4", url: "studentTV.stream", icon: "img/ids/studenttv.svg" }
		]
	};

	// Order by name
	var nameComparator = function (model) {
		return model.get("name").replace(/^the /i, "");
	};

	y4.Occupations = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/occupations/",
		comparator: nameComparator
	});

	y4.Genres = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/genres/",
		comparator: nameComparator
	});


	y4.Programmes = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/programmes/",
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
		}
	});
	y4.Adverts = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/adverts/",
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
		url: "http://"+baseUrl+"/api/campaigns/",
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
		url: 'http://'+baseUrl+'/api/users/',
		model: y4.User
	});

	y4.Channels = Backbone.Collection.extend({

	});

	y4.Playlist = Backbone.Model.extend({
		initialize: function (options) {
			this.user = options.user;
			this.programmes = new y4.Programmes();
			this.adverts = new y4.Adverts();
		},
		start: function () {
			if (this.poller) { return; }
			var that = this,
				dfd = this.programmeRecommendation();

			dfd.then(function () {
				that.next();
			});

			this.poller = setInterval(function () {
				that.poll();
			}, 20000);

			return dfd;
		},
		stop: function () {
			clearTimeout(this.poller);
		},
		poll: function () {
			this.programmes.at(0).fetch().then(function () {
				// check advert start
			});
		},
		programmeRecommendation: function () {
			var that = this;
			// FIXME: this must always put 1 programme in the collection
			return this.programmes.fetch({
				data: {
					user: this.user.id
				}
			});
		},
		advertRecommendation: function () {
			var that = this;
			return this.adverts.fetch({
				data: {
					user: this.user.id,
					programme: this.programmes.at(0).id
				}
			});
		},
		fetchNext: function () {
			this.nextType = "programme"; // Work this out from advert times
			switch (this.nextType) {
			case "programme": return this.programmeRecommendation();
			case "advert": return this.advertRecommendation();
			}
		},
		nextHasExpired: function () {
			return false;
		},
		next: function () {
			switch (this.nextType) {
			case "programme":
				this.trigger("programme", this.programmes.at(0));
				break;
			case "advert":
				this.trigger("advert", this.adverts.at(0));
				break;
			}
		}
	});

}(this.y4));
