(function (y4) {
	//"use strict";

	var baseUrl = window.location.hostname;

	// Following should be removed
	var virtualenvs = ["users.ecs.soton.ac.uk", "linuxproj.ecs.soton.ac.uk", "localhost", "your4.tv", "127.0.0.1"];
	if (virtualenvs.indexOf(window.location.hostname) > -1) {
		baseUrl = "www.your4.tv";
	}

	// Order by name
	var nameComparator = function (model) {
		var name = model.has("name") ? model.get("name") : model.get("title");
		return name.replace(/^the /i, "");
	};

	y4.Occupations = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/occupations/",
		comparator: nameComparator
	});

	y4.Genres = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/genres/",
		comparator: nameComparator
	});

	y4.Brands = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/brands/",
		comparator: nameComparator
	});

	y4.Programme = Backbone.Model.extend({
		duration: function () {
			return Math.ceil(this.get("duration"));
		},
		title: function () {
			return this.get("title");
		},
		thumbnail: function () {
			return "";
		}
	});

	y4.Programmes = Backbone.Collection.extend({
		model: y4.Programme,
		url: "http://"+baseUrl+"/api/programmes/",
		//comparator: nameComparator,
		recommendation: function (userId) {
			var that = this,
				dfd = $.Deferred();
			this.fetch({
				data: { user: userId }
			}).done(function () {
				dfd.resolve(that.first());
			}).fail(function () { dfd.reject(); });
			return dfd;
		}
	});

	y4.Broadcast = Backbone.Model.extend({
		initialize: function () {
			this.timeOffset = ((new Date()).getTime() / 1000) - this.get("timenow");
		},
		started: function () {
			return ((new Date()).getTime() / 1000) + this.timeOffset > this.get("time");
		},
		secondsTillStart: function () {
			return this.get("time") - (((new Date()).getTime() / 1000) + this.timeOffset)
		},
		fetchProgramme: function () {
			var collection = new y4.Programmes([{ id: this.get("programme_id") }]),
				programme = collection.first(),
				dfd = $.Deferred();
			programme.fetch().done(function () {
				dfd.resolve(programme);
			}).fail(function () { dfd.reject() });
			return dfd;
		}
	});

	y4.Broadcasts = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/broadcasts/",
		model: y4.Broadcast,
		recommendation: function (userId, startTime) {
			var that = this,
				dfd = $.Deferred();
			this.fetch({
				data: { user: userId, startTime: Math.floor(startTime) }
			}).done(function () {
				dfd.resolve(that.first()); // TODO: check there is a first?
			}).fail(function () { dfd.reject(); });
			return dfd;
		}
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
			overlay: "",
			duration: 0
		},
		duration: function () {
			return Math.ceil(this.get("duration"));
		},
		title: function () {
			return this.get("title");
		},
		thumbnail: function () {
			return "";
		}
	});

	y4.Blank = Backbone.Model.extend({
		duration: function () {
			return Math.ceil(this.get("duration"));
		},
		title: function () { return ""; },
		thumbnail: function () { return ""; }
	});
	y4.Adverts = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/adverts/",
		model: y4.Advert,
		recommendation: function (userId, programmeId, timelimit, excludeAdvertIds) {
			var that = this,
				dfd = $.Deferred();
			this.fetch({
				data: {
					user: userId,
					programme: programmeId,
					time_limit: Math.max(Math.floor(timelimit), 1),
					exclude_adverts: excludeAdvertIds.join(",")
				}
			}).done(function () {
				dfd.resolve(that.first()); // TODO: check there is a first?
			}).fail(function () { dfd.reject(); });
			return dfd;
		},
		comparator: function (m) {
			return -Number(m.id);
		}
	});

	y4.Impression = Backbone.Model.extend({
		defaults: {
			timestamp: 0,
			advert: [],
			user: [],
			skiptime: 0
		}
	});
	y4.Impressions = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/impressions/",
		model: y4.Impression
	});

	y4.Impression = Backbone.Model.extend({
		defaults: {
			timestamp: 0,
			advert: [],
			user: [],
			skiptime: 0
		}
	});
	y4.Impressions = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/impressions/",
		model: y4.Impression
	});


	y4.Campaign = Backbone.Model.extend({
		defaults: {
			title: "",
			startDate: 0,
			endDate: 0
		},
		initialize: function () {
			var that = this;
			this.targetCollections = {};
			_.each(this.get("targets"), function (targets, type) {
				that.targetCollections[type] = new y4.CampaignTargets(targets, { /*url: that.url() + "/targets/" + type + "/"*/ });
			});
			if (!this.get("targets")) {
				this.set({
					targets: {
						ageRanges: [],
						boundingBoxes: [],
						times: [],
						genres: [],
						occupations: [],
						brands: [],
						genders: [],
						schedules: []
					}
				});
			}
			if (!this.get("adverts")) {
				this.set({ adverts: [] });
			}
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
		loginFB: function () {
			var that = this,
				dfd = $.Deferred();

			if (y4.allowFacebookLogin) {
				FB.login(function (response) {
					if (response.authResponse) {
						that.getFbUser().then(function() {
							dfd.resolve();
						});
					} else {
						dfd.reject();
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

	y4.ProgrammeSection = Backbone.Model.extend({

	});

	y4.PlaylistItem = Backbone.Model.extend({
		defaults: {
			live: false
		},
		initialize: function (m, options) {
			this.timeOffset = options.timeOffset;
			this.item = this.get("item");
		},
		duration: function () {
			return this.item.duration();
		},
		title: function () {
			return this.item.title();
		},
		localTime: function () {
			return this.get("time") - this.timeOffset;
		},
		thumbnail: function () {
			return this.item.thumbnail();
		},
		start: function () {
			var that = this;
			if (this.item.start) { this.item.start(); }
			this.trigger("start");
			setTimeout(function () {
				that.trigger("finish");
			}, this.duration() * 1000);
			return this;
		}
	});

	y4.AdvertBreak = Backbone.Collection.extend({
		model: y4.PlaylistItem,
		ready: false,
		initialize: function (c, options) {
			var that = this;
			this.breakDuration = options.duration;
			this.programmeId = options.programmeId || 0;
			this.userId = options.userId;
			this.timeOffset = options.timeOffset;
			this.on("add", function () {
				if (!that.ready) {
					that.ready = true;
					that.trigger("ready");
				}
			});
		},

		fill: function () {
			return this.pushAdvert(this.breakDuration - this.totalDuration());
		},

		duration: function () {
			return this.breakDuration;
		},
		title: function () {
			return "Ad break";
		},
		thumbnail: function () {
			return "";
		},

		start: function () {
			console.log("NBAHHH", this.first())
			this.playItem(0);
			return this;
		},

		playItem: function (i) {
			var that = this;
			console.log("Starting on ", this.at(i), i)
			this.at(i).start().on("finish", function () {
				if (i + 1 < that.length) {
					that.playItem(i + 1);
				}
			});
		},

		totalDuration: function () {
			return _(this.playlist).reduce(function (memo, item) {
				return memo + Number(item.item.duration);
			}, 0);
		},

		pushAdvert: function (timelimit) {
			var that = this,
				dfd = $.Deferred(),
				programmeId = this.programmeId,
				timelimit = timelimit || 0,
				advertIds = this.map(function (item) {
					return item.item.id;
				});

			that.pushAdvertRecommendation(timelimit, programmeId, advertIds).done(function (advert) {
				that.pushAdvert(timelimit - advert.duration()).done(function (timeleft) {
					dfd.resolve(timeleft);
				});
			}).fail(function () {
				dfd.resolve(timelimit);
			});
			return dfd;
		},

		setDuration: function (duration) {
			var sumDuration = 0;
			// Keep only adverts that fit in the duration
			this.reset(this.select(function (item) {
				sumDuration += item.duration();
				return sumDuration <= duration;
			}));
			// Fill up the ad break;
			return this.fill();
		},

		pushAdvertRecommendation: function (timelimit, programmeId, excludeAdvertIds) {
			var that = this,
				dfd = $.Deferred();
			(new y4.Adverts()).recommendation(this.userId, programmeId, timelimit, excludeAdvertIds).done(function (advert) {

				var item = new y4.PlaylistItem({
					type: "advert",
					item: advert,
					time: that.totalDuration()
				}, { timeOffset: that.timeOffset });

				item.on("start", function () {
					that.trigger("adStart", advert);
				}).on("finish", function () {
					that.trigger("adFinish", advert);
				});

				that.add(item);

				dfd.resolve(advert);
			}).fail(function () {
				that.add({
					type: "blank",
					time: that.totalDuration(),
					item: new y4.Blank({ duration: timelimit })
				});
				dfd.reject();
			});
			return dfd;
		}
	})

	y4.Playlist = Backbone.Collection.extend({
		model: y4.PlaylistItem,
		started: false,
		initialize: function (models, options) {
			var that = this;
			this.user = options.user;
			/*this.reset([
				{ type: "break", item: new y4.AdbreakAdverts() },
				{ type: "broadcast", item: new y4.ProgrammeSection({ section: 0 }) },
				{ type: "break", item: new y4.AdbreakAdvert() },
				{ type: "broadcast", item: new y4.ProgrammeSection({ section: 1 }) },
				{ type: "break", item: new y4.AdbreakAdvert() },
				{ type: "vod", section: 1, item: new y4.ProgrammeSection() }
				// etc
			];*/
			this.on("add", function () {
				if (!that.started) {
					that.started = true;
					this.start();
					that.trigger("started");
				}
			});
			this.fetchBroadcasterTime().done(function () {
				that.trigger("ready");
			});
			setInterval(function () {
				that.fill();
			}, 60000);
		},

		fetchBroadcasterTime: function () {
			var that = this,
				localNow = (new Date).getTime() / 1000;
			return $.ajax({
				url: 'http://'+baseUrl+'/api/time/',
				dataType: "json",
				contentType: "application/json"
			}).done(function (response) {
				that.timeOffset = response[0].time - localNow;
			});
		},

		broadcasterTime: function () {
			var localNow = (new Date).getTime() / 1000;
			return localNow + this.timeOffset;
		},

		broadcasterPlaylistStartTime: function () {
			return this.first() ? this.first().get("time") : this.broadcasterTime();
		},

		broadcasterPlaylistEndTime: function () {
			return this.broadcasterPlaylistStartTime() + this.totalDuration();
		},

		start: function () {
			this.playItem(0);
			return this;
		},

		playItem: function (i) {
			var that = this;
			this.currItem = this.at(i);
			this.at(i).start().on("finish", function () {
				that.playItem(i + 1);
			});
		},

		totalDuration: function () {
			return this.reduce(function (memo, item) {
				if (!item.get("partOfProgramme")) {
					memo += Number(item.item.duration());
				}
				return memo;
			}, 0);
		},

		programmeCount: function () {
			return this.reduce(function (memo, item) {
				if (item.get("type") === "programme") {
					memo++;
				}
				return memo;
			}, 0);
		},

		minPlaylistDuration: 7200, // 2 hours in advance
		minNumberOfProgrammes: 4,

		// Fill the playlist up to the minimum length or minimum number of programmes
		fill: function () {
			console.log("Filling up the playlist (runs until playlist is full)")
			console.log("Currently " + this.totalDuration() + "s, " + this.programmeCount() + " programmes.")
			var that = this,
				programmeFetcher = $.Deferred(),
				dfd = $.Deferred();

			if (this.totalDuration() < this.minPlaylistDuration ||
					this.programmeCount() < this.minNumberOfProgrammes) {

				// Try to get a broadcast
				console.log("Trying to get a broadcast");
				this.pushBroadcastRecommendation(that.broadcasterPlaylistEndTime()).done(function () {
					programmeFetcher.resolve()
				}).fail(function () {
					// No broadcast? Get a vod
					console.log("No broadcast, getting vod")
					that.pushVodRecommendation().done(function () {
						programmeFetcher.resolve();
					}).fail(function () { console.error("FIXME: impossible case"); });
				});

				// Once recommendation has been made, add more to the playlist -- asynchronous recursivity!
				programmeFetcher.done(function () {
					console.log("Programme added")
					that.fill().done(function () {
						dfd.resolve();
					});
				});
			} else {
				console.log("Playlist filled.")
				dfd.resolve();
			}

			return dfd;
		},

		pushProgramme: function (programme, breakBeforeDuration, broadcast) {
			var that = this,
				dfd = $.Deferred();

			console.log("Pushing " + programme.get("title"));
			console.log("Filling break")
			// Fill in time before start with adverts
			this.pushAdverts(breakBeforeDuration, programme).dfd.done(function () {
				var time = that.broadcasterPlaylistEndTime(),
					item = new y4.PlaylistItem({
						type: "programme",
						live: broadcast ? true : false,
						item: programme,
						time: time
					}, { timeOffset: that.timeOffset });

				item.on("start", function () {
					if (broadcast) {
						that.trigger("broadcast", broadcast);
					} else {
						that.trigger("programme", programme);
					}
				});

				that.add(item);

				var breaks = {},
					updateBreaks = function () {
						// Remove old breaks
						_.each(breaks, function (adbreak) {
							that.remove(adbreak);
						});
						// Add new breaks
						_.each(programme.get("adbreaks"), function (adbreak) {
							var startTime = Number(adbreak.startTime) + time,
								duration = adbreak.endTime - adbreak.startTime;
							breaks[adbreak.id] = that.addAdverts(startTime, duration, programme, true).adbreak;
						});
					};

				programme.on("change:adbreaks", function () {
					updateBreaks();
				});

				updateBreaks();

				dfd.resolve();
			});

			return dfd;
		},
		addAdverts: function (time, duration, programme, partOfProgramme) {
			console.log("Preparing advert break.");
			var that = this,
				dfd = $.Deferred(),
				adbreak = new y4.AdvertBreak(undefined, {
					duration: duration,
					userId: this.user.id,
					programmeId: programme ? programme.id : 0,
					startTime: time,
					timeOffset: that.timeOffset
				}),
				item = new y4.PlaylistItem({
					type: "adbreak",
					item: adbreak,
					time: time,
					partOfProgramme: partOfProgramme
				}, { timeOffset: that.timeOffset });

			adbreak.on("adStart", function (advert) {
				that.trigger("advert", advert);
			}).on("ready", function () {
				that.add(item);
				dfd.resolve();
			});

			adbreak.fill();

			return { adbreak: adbreak, dfd: dfd };
		},
		pushAdverts: function (duration, programme) {
			return this.addAdverts(this.broadcasterPlaylistEndTime(), duration, programme);
		},
		pushBroadcastRecommendation: function (startTime) {
			var that = this,
				dfd = $.Deferred();
			(new y4.Broadcasts()).recommendation(this.user.id, startTime).done(function (broadcast) {
				broadcast.fetchProgramme().done(function (programme) {
					that.pushProgramme(programme, broadcast.get("time") - that.broadcasterPlaylistEndTime(), broadcast).done(function () {
						dfd.resolve();
					}).fail(function () { console.error("FIXME: impossible case"); });
				}).fail(function () { console.error("FIXME: impossible case"); });
			}).fail(function () { dfd.reject(); });
			return dfd;
		},
		pushVodRecommendation: function () {
			var that = this,
				dfd = $.Deferred(),
				duration = this.totalDuration();
			(new y4.Programmes()).recommendation(this.user.id).done(function (programme) {
				that.pushProgramme(programme, duration < 100 ? 0 : 120).done(function () {
					dfd.resolve();
				});
			}).fail(function () { console.error("FIXME: impossible case"); });
			return dfd;
		}
	});

}(this.y4));
