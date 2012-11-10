(function (y4) {
	"use strict";

	var baseUrl = window.location.hostname;

	// Following should be removed
	var virtualenvs = ["users.ecs.soton.ac.uk", "linuxproj.ecs.soton.ac.uk", "localhost", "your4.tv"];
	if (virtualenvs.indexOf(window.location.hostname) > -1) {
		baseUrl = "www.your4.tv";
	}

	y4.bootstrap = {
		channels: [
			{ id: "518974809", title: "Channel 4", service: "your4", url: "c4.stream", icon: "img/ids/c4.svg" },
			{ id: "518975484", title: "E4", service: "your4", url: "e4.stream", icon: "img/ids/e4.svg" },
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

	y4.Broadcasts = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/broadcasts/"
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
		model: y4.User,

		loggedIn: function () {
			var user = this.first();
			if (user && user.id !== "me" && user.get("registered")) {
				return user;
			} else {
				return null;
			}
		},

		fetchLoggedInUser: function () {
			var that = this,
				dfd = $.Deferred(),
				user = this.reset([{ id: "me" }]).first();

			user.fetch().done(function () {
				dfd.resolve(user);
			}).fail(function () {
				that.fetchLoggedInUserFB().done(function (user) {
					dfd.resolve(user);
				}).fail(function () {
					dfd.reject();
				});
			});

			return dfd;
		},
		fetchLoggedInUserFB: function () {
			var that = this,
				dfd = $.Deferred();

			if (y4.allowFacebookLogin) {
				FB.getLoginStatus(function (response) {
					if (response.status === 'connected') {
						that.getFbUser().done(function(user) {
							dfd.resolve(user);
						}).fail(function() {
							dfd.reject();
						});
					} else {
						dfd.reject();
					}
				});
			} else {
				dfd.reject();
			}

			return dfd;
		},
		getFbUser: function() {
			var that = this,
				dfd = $.Deferred();

			if (y4.allowFacebookLogin) {
				FB.api('/me', function (response) {
					var user = that.reset([{ id: 'fb-' + response.id }]).first();
					user.fetch().done(function () {
						if (user.get('registered')) {
							dfd.resolve(user);
						} else {
							that.user.on("register", function (user) {
								dfd.resolve(user);
							});
							//that.register();
						}
					}).fail(function() {
						dfd.reject();
					});
				});
			} else {
				dfd.reject();
			}

			return dfd;
		},
		register: function (o) {
			var that = this,
				dfd = $.Deferred();

			this.reset().create(o, {
				success: function() {
					dfd.resolve();
				},
				error: function(model, response) {
					dfd.reject(response);
				}
			});

			return dfd;
		},
		login: function (email, password) {
			return this.fetch({
				data: {
					email: email,
					password: password
				}
			});
		},
		registerFB: function () {

		},
		loginFB: function () {

		},
		logout: function () {
			return this.first().destroy();
		}
	});

	y4.Channels = Backbone.Collection.extend({
		url: 'http://'+baseUrl+'/api/channels/'
	});

	y4.Playlist = Backbone.Model.extend({
		initialize: function (options) {
			this.user = options.user;
			this.broadcasts = new y4.Broadcasts();
			this.adverts = new y4.Adverts();
		},
		start: function () {
			if (this.poller) { return; }
			var that = this,
				dfd = this.programmeRecommendation();

			dfd.then(function () {
				that.nextType = "programme";
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
			this.broadcasts.first().fetch().then(function () {
				// check advert start
			});
		},
		programmeRecommendation: function () {
			var that = this;
			// FIXME: this must always put 1 programme in the collection
			return this.broadcasts.fetch({
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
					programme: this.broadcasts.first().id
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
				this.trigger("programme", this.broadcasts.first());
				break;
			case "advert":
				this.trigger("advert", this.adverts.first());
				break;
			}
		}
	});

}(this.y4));
