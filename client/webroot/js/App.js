
(function(y4) {
	"use strict";

	y4.App = Backbone.View.extend({
		events: {
			"mousemove": "showOverlay",
			"touchstart": "showOverlay",
			"click .icon-play": "play",
			"click .icon-stop": "stop"
		},
		initialize: function (options) {
			var that = this;

			this.login = new y4.Login();
			this.showSpinner();
			this.player = new y4.Player({ server: options.server });

			this.advertCollection = new y4.AdvertCollection(undefined, { player: this.player });

			this.channelCollection = new y4.ChannelCollection(undefined, { player: this.player });
			this.vodCollection = new y4.VODCollection(undefined, { player: this.player });
			this.programmeCollection = new y4.ProgrammeCollection(undefined, {
				channelCollection: this.channelCollection,
				vodCollection: this.vodCollection
			});

			this.personalChannel = new y4.PersonalChannel({
				advertCollection: this.advertCollection,
				programmeCollection: this.programmeCollection
			});

			this.on("start", function () {
				that.personalChannel.start();
			});
				
			_.bindAll(this);
		},

		play: function () { this.player.play(); },
		stop: function () { this.player.stop(); },


		setPlaylist: function (_playlist) {
			var that = this,
				playlist = _.clone(_playlist),

				underplay = 2000, // when to start playing before showing - start earlier to give more buffer time
				overplay = 500, // milliseconds longer to play a stream after an advert has shown

				playItem = function (item) {
					var scene = item.scene,
						duration = item.duration,
						i;

					if (scene instanceof y4.VideoScene) {
						that.setVideoScene(scene, duration + overplay);
					} else if (scene instanceof y4.StillScene) {
						that.setStillScene(scene, duration);
						// Iterate through items to find next video scene so that it can buffer
						if (playlist.length && (playlist[0].scene instanceof y4.VideoScene)) {
							setTimeout(function () {
								that.player.videoLayer.mute().set(playlist[0].scene);
							}, item.duration - underplay);
						}
					} else {
						return y4.error("Invalid item");
					}

					if (item.duration) {
						setTimeout(function () {
							if (playlist.length) { playItem(playlist.shift()); }
						}, item.duration + overplay);
					}
				};

			playItem(playlist.shift());
		},

		render: function () {
			var that = this,
				playerTemplate = _.template($("#player-template").html());

			this.$el.html(playerTemplate());
			this.renderChannelButtons();
			this.$el.append(this.player.render().el);
			this.$el.find('.logo-frame').append(this.login.render().el);

			return this;
		},

		renderChannelButtons: function () {
			var that = this,
				$channels = this.$('.channels');

			_.each(this.options.channels, function (channel, i) {
				var $el = $('<a class="channel" href="javascript:;">' +
					'<div>' +
						'<img class="icon" src="' + channel.icon + '">' +
				 		'<span class="title">' + channel.title + '</span>' +
				 	'</div>' +
				 	'</a>'),
					$icon = $el.find(".icon");
				$el.on("click touchstart", function () {
					that.setVideoScene(channel);
				});
				$channels.append($el);

				/*var refresh = function () {
					$icon.attr("src", channel.icon + "?" + (new Date()).getTime());
					setTimeout(refresh, 60000);
				}
				setTimeout(refresh, 60000 + i * 5000)*/
			});
		},

		start: function () {
			var that = this;

			this.$(".start-screen").hide();
			this.player.play();
			this.showOverlay();

			this.trigger("start");
		},

		showOverlay: function () {
			var that = this;
			if (!this.overlayIsShown) {
				this.$(".channels, .player-controls").fadeIn(200);
				this.overlayIsShown = true;
			}
			clearTimeout(this.hideOverlayTimeout);
			this.hideOverlayTimeout = setTimeout(function () {
				that.hideOverlay();
			}, 1500);
			return this;
		},

		hideOverlay: function () {
			this.$(".channels, .player-controls").dequeue().fadeOut(200);
			this.overlayIsShown = false;
			return this;
		},

		log: function (msg) {
			this.$(".log").html(msg + "<br>" + this.$(".log").html());
		},

		showSpinner: function(opts) {
			if (!opts) {
				opts = {
					lines: 13,
					length: 21,
					width: 4,
					speed: 1.4,
					color: '#fff'
				};
			}

			this.spinner = new Spinner(opts).spin($('body')[0]);
		},

		hideSpinner: function(opts) {
			if (this.spinner) {
				this.spinner.stop();
			}
		}
	});

	y4.Register = Backbone.View.extend({

		regFields: ["name","gender","dob","email","occupation","password"],
		events: {
			"change .register-form input": "changeField",
			"change .register-form select": "changeField",
			"click .submit-registration": "submitReg"
		},

		className: "logon-outer",

		initialize: function() {
			var that = this;
			this.user = this.options.user;
			if (!this.user) {
				this.userCollection = new y4.UserCollection();
				this.user = new y4.UserModel();
				this.userCollection.add(this.user);
			}

			this.occupations = new y4.OccupationCollection();

		},

		render: function() {
			var registerTemplate = _.template($('#register-template').html());
			
			if (this.user.get('facebookId') != null) {
				this.regFields.pop();
			}
			
			var that = this;
			var toRequest = _.filter(this.regFields, function(field) {
				field = that.user.get(field);
				if (field == null || typeof(field) === 'undefined') {
					return true;
				}
			});

			this.$el.html(registerTemplate({user: this.user.toJSON(), req: toRequest, fields: this.regFields, occupations: this.occupations}));
			this.occupations.fetch().then(function() {
				var occSelect = $('.register-form :input[name="occupation"]');
				that.occupations.each(function(occupation) {
					occSelect.append($('<option>', {value: occupation.get('id')}).text(occupation.get('name')));		
				});
			});

			return this;
		},

		changeField: function(e) {
			var target = $(e.currentTarget);
			this.user.set(target.attr('name'),target.val());
		},

		submitReg: function() {
			var that = this;
			this.user.save(undefined, {success: function() {
				y4.app.login.userModel = that.user;
				y4.app.start();	
			}, error: function(model, response) {
				that.$el.prepend(response);
			}});
		}
	});

	y4.Login = Backbone.View.extend({
		className: "logon-outer",
		events: {
			"click .facebook-button": "facebookLogin",
			"click .register-button": "renderReg"
		},

		initialize: function() {
			_.bindAll(this, 'logout');
			this.userCollection = new y4.UserCollection();
			var that = this;
			this.userModel = new y4.UserModel({id: 'me'});
			this.userCollection.add(that.userModel);
			this.userModel.fetch({success: function() {
				y4.app.start();
			}, error: function() {
				FB.getLoginStatus(function(response) {
					if (response.status === 'connected') {
						that.retrieveUser();
					} else if (response.status === 'not_authorized') {
						that.facebookLoggedIn = false;
						y4.app.hideSpinner();
						that.renderLogin();
					} else {
						that.facebookLoggedIn = false;
						y4.app.hideSpinner();
						that.renderLogin();
					}
				});	
			}});
		},

		facebookLogin: function() {
			var that = this;
			if (!this.facebookLoggedIn) {
				$('.facebook-button').attr('disabled','disabled');
				$('.facebook-button').text("Please wait...");
				FB.login(function(response) {
					if (response.authResponse) {
						that.facebookLoggedIn = true;
						that.retrieveUser();
					}					
				}, {scope: 'user_birthday,email'});
			}
		},
	
		// Crucial. Sets server side session and ensures user is registered.
		retrieveUser: function() {
			var that = this;
			FB.api('/me', function(response) {
				that.userModel = new y4.UserModel({id: 'fb-'+response.id});
				that.userCollection.add(that.userModel);
				that.userModel.fetch().then(function() {
					if (that.userModel.get("registered")) {
						y4.app.start();
					} else {
						that.renderReg(undefined, that.userModel);
					}
					y4.app.hideSpinner();
				});
			});
		},

		renderReg: function(e, user) {
			var registerView = new y4.Register({user: user});
			$(".logo-frame").html(registerView.render().el);
		},

		logout: function() {
			this.userModel.destroy().then(function(response) {
				if (response == "success") {
					window.location = 'http://'+window.location.hostname;
				}
			});
		},

		render: function() {
			return this;
		},

		renderLogin: function() {
			var loginTemplate = _.template($('#login-template').html());
			this.$el.html(loginTemplate());
		}

	});

	y4.viewManager = {
		showView: function(view) {
			$('#container').html(view.render().el);		
		}
	}

	y4.Router = Backbone.Router.extend({
		
		routes: {
			"":	"default"
		},

		default: function() {
			y4.viewManager.showView(y4.app);
		}

	});
	
}(this.y4));
