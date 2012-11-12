(function (y4) {
	"use strict";

	var baseUrl = window.location.hostname;

	// Following should be removed
	var virtualenvs = ["users.ecs.soton.ac.uk", "linuxproj.ecs.soton.ac.uk", "localhost", "your4.tv"];
	if (virtualenvs.indexOf(window.location.hostname) > -1) {
		baseUrl = "www.your4.tv";
	}

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
		//comparator: nameComparator
	});

	y4.Broadcast = Backbone.Model.extend({
		initialize: function () {
			this.timeOffset = ((new Date()).getTime() / 1000) - this.get("timenow");
		},
		started: function () {
			console.log(this.timeOffset)
			return ((new Date()).getTime() / 1000) + this.timeOffset > this.get("time");
		},
		secondsTillStart: function () {
			return this.get("time") - (((new Date()).getTime() / 1000) + this.timeOffset)
		}
	});

	y4.Broadcasts = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/broadcasts/",
		model: y4.Broadcast
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
						dfd.resolve(user);
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
			var that = this,
				dfd = $.Deferred();

			if (y4.allowFacebookLogin) {
				FB.login(function (response) {
					if (response.authResponse) {
						that.getFbUser().then(function() {
							dfd.resolve();
						});
					}
				}, { scope: 'user_birthday,email' });
			} else {
				dfd.reject("Facebook login disabled on this host.");
			}

			return dfd;
		},
		logout: function () {
			var dfd = this.first().destroy().done(function() {
				FB.getLoginStatus(function(response) {
					if (response.status === 'connected') {
						FB.logout(function(response) {
							dfd.resolve();	
						});
					} else {
						dfd.resolve();
					}
				});
			});

			return dfd;
		}
	});

	y4.Channels = Backbone.Collection.extend({
		url: 'http://'+baseUrl+'/api/channels/'
	});

	y4.Playlist = Backbone.Model.extend({
		initialize: function (options) {
			this.user = options.user;
			this.broadcasts = new y4.Broadcasts();
			this.programmes = new y4.Programmes();
			this.adverts = new y4.Adverts();
		},
		start: function (advert, force) {
			return this.recommend();
		},

		showAdvert: function (broadcast) {
			console.log("Showing advert");
			var that = this,
				dfd = $.Deferred();
			that.advertRecommendation(broadcast).done(function (advert) {
				that.advert(advert).on("finish", function () {
					dfd.resolve();
				});
			}).fail(function () {
				dfd.resolve();
			});
			return dfd;
		},

		startBroadcast: function (broadcast) {
			console.log("Starting broadcast");
			var that = this,
				inAdBreak = false.
				showAdBreakAdvert = function () {
					that.showAdvert(broadcast).done(function () {
						if (inAdBreak) { showAdBreakAdvert(); }
					});
				};
			that.broadcast(broadcast).on("breakStart", function () {
				inAdBreak = true;
				showAdBreakAdvert();
			}).on("breakFinish", function () {
				inAdBreak = false;
			}).on("finish", function () {
				that.recommend();
			});
		},
		// Shows adverts until broadcast has started
		hasBroadcastStarted: function (broadcast) {
			console.log("Checking broadcast");
			var that = this;
			if (broadcast.started()) {
				this.startBroadcast(broadcast);
			} else {
				console.log("Broadcast not yet started - " + (broadcast.secondsTillStart() / 60) + " minutes to start");
				this.showAdvert(broadcast).done(function () { that.hasBroadcastStarted(broadcast); });
			}
		},

		recommend: function () {
			console.log("Making recommendation");
			var that = this,
				dfd = $.Deferred();

			this.broadcastRecommendation().done(function (broadcast) {
				that.hasBroadcastStarted(broadcast);
				dfd.resolve();
			}).fail(function () {
				that.programmeRecommendation().done(function (programme) {
					dfd.resolve();
					that.programme(programme).on("breakStart", function () {

					}).on("finish", function () {
						that.recommend();
					});
				}).fail(function () {
					dfd.resolve();
					that.showAdvert().done(function () {
						that.recommend();
					});
				});
			});

			return dfd;
		},

		broadcast: function (broadcast) {
			var o = _.extend({}, Backbone.Events),
				mosStartTimers = {},
				mosEndTimers = {},
				endBroadcastTimer = setTimeout(function () {
					clearTimeout(poller);
					o.trigger("finish");
				}, broadcast.get("duration") * 1000);

			var poller = setInterval(function () {
				broadcast.fetch().done(function () {
					_.each(broadcast.get("mos"), function (mos) {
						if (mosStartTimers[mos.id]) {
							clearTimeout(mosStartTimers[mos.id]);
							clearTimeout(mosEndTimers[mos.id])
						}
						mosStartTimers[mos.id] = setTimeout(function () {
							o.trigger("breakStart");
						}, (broadcast.get("timenow") - mos.start) * 1000);
						mosEndTimers[mos.id] = setTimeout(function () {
							o.trigger("breakFinish");
						}, (broadcast.get("timenow") - mos.end) * 1000);
					})
				});
			}, 60000);

			this.trigger("broadcast", broadcast);

			return o;
		},
		programme: function (programme) {

		},
		advert: function (advert) {
			var o = _.extend({}, Backbone.Events),
				// TODO change with player event
				endAdvertTimer = setTimeout(function () {
					o.trigger("finish");
				}, advert.get("duration") * 1000);

			console.log(advert)
			this.trigger("advert", advert);

			return o;
		},

		broadcastRecommendation: function () {
			var that = this,
				dfd = $.Deferred();
			this.broadcasts.fetch({
				data: { user: this.user.id }
			}).done(function () {
				dfd.resolve(that.broadcasts.first()); // TODO: check there is a first?
			}).fail(function () { dfd.reject(); });
			return dfd;
		},
		programmeRecommendation: function () {
			var that = this,
				dfd = $.Deferred();
			this.programmes.fetch({
				data: { user: this.user.id }
			}).done(function () {
				dfd.reject(); // FIXME
			}).fail(function () { dfd.reject(); });
			return dfd;
		},
		advertRecommendation: function (broadcast) {
			var that = this,
				dfd = $.Deferred();
			this.adverts.fetch({
				data: {
					user: this.user.id,
					programme: broadcast ? broadcast.get("programme_id") : 0,
					time_limit: broadcast ? Math.max(1, Math.floor(broadcast.secondsTillStart())) : 0
				}
			}).done(function () {
				dfd.resolve(that.adverts.first()); // TODO: check there is a first?
			}).fail(function () { dfd.reject(); });
			return dfd;
		}
	});

}(this.y4));
