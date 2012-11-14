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
		//comparator: nameComparator,
		recommendation: function (userId) {
			var that = this,
				dfd = $.Deferred();
			this.programmes.fetch({
				data: { user: userId }
			}).done(function () {
				dfd.reject(); // FIXME
			}).fail(function () { dfd.reject(); });
			return dfd;
		}
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
		model: y4.Broadcast,
		recommendation: function (userId, startTime) {
			var that = this,
				dfd = $.Deferred();
			broadcasts.fetch({
				data: { user: userId, startTime: startTime }
			}).done(function () {
				dfd.resolve(that.broadcasts.first()); // TODO: check there is a first?
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
			overlay: ""
		}
	});
	y4.Adverts = Backbone.Collection.extend({
		url: "http://"+baseUrl+"/api/adverts/",
		model: y4.Advert,
		recommendation: function (userId, programmeId, timelimit) {
			var that = this,
				dfd = $.Deferred();
			this.adverts.fetch({
				data: {
					user: userId,
					programme: programmeId,
					time_limit: timelimit
				}
			}).done(function () {
				dfd.resolve(that.adverts.first()); // TODO: check there is a first?
			}).fail(function () { dfd.reject(); });
			return dfd;
		}
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

	y4.AdbreakAdverts = y4.Adverts.extend({
		initialize: function (models, options) {
			this.user = options.user;
			this.programmeId = options.programmeId;
		},,
		advertRecommendation: function (broadcast) {
			return (new y4.Adverts()).recommendation(this.user.id, programmeId, timelimit);
		}
		fetchRecommendedAdvert: function (timelimit) {
			var dfd = $.Deferred(),
				adverts = new y4.Adverts();
			adverts.fetch({
				data: {
					user: this.user,
					programme: this.programme,
					timelimit: timelimit
				}
			}).done(function () {
				dfd.resolve(adverts.first());
			}).fail(function () { dfd.reject(); });
			return dfd;
		}
		setBreakDuration: function (s) {
			var that = this,
				dfd = $.Deferred(),
				timeRemaining = s - this.totalDuration(),
				addAdvert = function () {
					if (timeRemaining <= 0) {
						dfd.resolve();
						return;
					}
					that.fetchRecommendedAdvert(timeRemaining).done(function () {
						addAdvert();
					}).fail(function () {
						dfd.resolve();
					});
				};
			this.duration = s;
			addAdvert();
			return dfd;
		},
		totalDuration: function () {
			return this.reduce(function (memo, model) {
				return memo + Number(model.get("duration"));
			}, 0);
		}
	});

	y4.ProgrammeSection = Backbone.Model.extend({

	});

	y4.PlaylistItem = Backbone.Model.extend({

	});

	y4.Playlist = Backbone.Collection.extend({
		model: y4.playlistItem,
		initialize: function (options) {
			this.user = options.user;
			this.programmes = [];
			/*this.reset([
				{ type: "break", item: new y4.AdbreakAdverts() },
				{ type: "broadcast", item: new y4.ProgrammeSection({ section: 0 }) },
				{ type: "break", item: new y4.AdbreakAdvert() },
				{ type: "broadcast", item: new y4.ProgrammeSection({ section: 1 }) },
				{ type: "break", item: new y4.AdbreakAdvert() },
				{ type: "vod", section: 1, item: new y4.ProgrammeSection() }
				// etc
			];*/
		},

		fetchBroadcasterTime: function () {
			var that = this,
				localNow = (new Date).getTime() / 1000;
			return $.ajax({
				url: 'http://'+baseUrl+'/api/time/',
				dataType: "json",
				contentType: "application/json"
			}).done(function (resonse) {
				that.timeOffset = response.broadcastNow - localNow;
			});
		},

		broadcasterTime: function () {
			var localNow = (new Date).getTime() / 1000;
			return localNow + this.timeOffset;
		},

		broadcasterPlaylistEndTime: function () {

		},

		start: function (advert, force) {
			var that = this,
				dfd = $.Deferred();
			this.fetchBroadcastTime().done(function () {
				that.fill().done(function () {
					dfd.resolve();
				});
			});
			return this;
		},

		totalDuration: function () {
			return _(this.playlist).reduce(function (memo, item) {
				return memo + Number(item.item.duration);
			}, 0);
		},

		programmeCount: function () {
			this.programmes.length;
		},

		minPlaylistDuration: 60000, // 1 hour in advance
		minNumberOfProgrammes: 2,

		// Fill the playlist up to the minimum length or minimum number of programmes
		fill: function () {
			var that = this,
				programmeFetcher = $.Deferred(),
				dfd = $.Deferred();

			if (this.totalDuration() < this.minPlaylistDuration &&
					this.programmeCount() < minNumberOfProgrammes) {

				// Try to get a broadcast
				this.pushBroadcastRecommendation(that.broadcasterPlaylistEndTime()).done(function () {
					programmeFetcher.resolve()
				}).fail(function () {
					// No broadcast? Get a vod
					that.pushVodRecommendation().done(function () {
						programmeFetcher.resolve();
					}).fail(function () { console.error("FIXME: impossible case"); });
				});

				// Once recommendation has been made, add more to the playlist -- asynchronous recursivity!
				programmeFetcher.done(function () {
					that.fill().done(function () {
						dfd.resolve();
					});
				});
			} else {
				dfd.resolve();
			}

			return dfd;
		},

		pushProgramme: function (programme, breakBeforeDuration) {
			var that = this,
				dfd = $.Deferred();

			// Fill in time before start with adverts
			this.pushAdverts(breakBeforeDuration, programme).done(function () {
				// Split programmes into sections with breaks for adverts
				var programmeSections = new y4.ProgrammeSections(undefined, {
					programme: programme,
					advertTimings: programme.advertTimings()
				});

			});
			// fill in time in adbreaks with adverts
			// get broadcast for after that broadcast/programme has finished

			this.programmes.push(model);

			that.add({ type: "broadcast", startTime: broadcast.localStartTime() });

			// split programme into sections
					var sections = new y4.ProgrammeSections(),
						sectionMap = {},
						updateAdvertsBetweenSection = function () {
							var section1, section2;
							for (var i = 0; i < sections.length - 1; i++) {
								section1 = sections.at(i)
							}
						};

					sections.on("add", function (section) {
						var item = y4.playlistItem({
							type: "vod",
							startTime: y4.now() + that.totalDuration() + section.time,
							item: section
						});
						sectionMap[section.id] = item;
						that.add(item);
					}).on("remove", function (section) {
						sectionMap[section.id].destroy();
						delete sectionMap[section.id];
					});
		},

		pushAdverts: function (timelimit, programme) {
			console.log("Preparing advert break.");
			var that = this,
				dfd = $.Deferred(),
				programmeId = programme ? programme.id : 0,
				timelimit = timelimit || 0;

			that.pushAdvertRecommendation(timelimit, programmeId).done(function (advert) {
				that.pushAdverts(timelimit - advert.duration()).done(function () {
					dfd.resolve();
				});
			}).fail(function () {
				dfd.resolve();
			});
			return dfd;
		},

		recommend: function () {
			console.log("Fetching a recommendation");
			var that = this,
				dfd = $.Deferred();

			this.fillBroadcasts().done(function (broadcast) {
				broadcast.get("time") - broadcast.get("timenow")
			})

			this.broadcastRecommendation().done(function (broadcast) {
				that.hasBroadcastStarted(broadcast);
				dfd.resolve();
			}).fail(function () {
				console.log("No broadcast recommendation - trying programmes");
				that.programmeRecommendation().done(function (programme) {
					dfd.resolve();
					that.programme(programme).on("breakStart", function () {

					}).on("finish", function () {
						that.recommend();
					});
				}).fail(function () {
					console.log("No programme recommendation - resorting to 2 minute ad break")
					dfd.resolve();
					that.showAdverts(null, 120).done(function () {
						that.recommend();
					});
				});
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

		pushBroadcastRecommendation: function (startTime) {
			var that = this,
				dfd = $.Deferred();
			(new y4.Broadcasts()).recommendation(this.user.id, startTime).done(function (broadcast) {
				that.pushProgramme("broadcast", broadcast, broadcast.broadcasterTime() - that.broadcasterPlaylistEndTime()).done(function () {
					dfd.resolve(broadcast);
				});
			});
			return dfd;
		},
		pushProgrammeRecommendation: function () {
			var that = this,
				dfd = $.Deferred();
			(new y4.Programmes()).recommendation(this.user.id).done(function (vod) {
				that.pushProgramme("vod", vod, 120).done(function () {
					dfd.resolve(vod);
				});
			});
			return dfd;
		}
	});

}(this.y4));
