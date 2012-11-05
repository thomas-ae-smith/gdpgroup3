(function (y4) {
	"use strict";

	var wowzaServer = "152.78.144.19:1935";

	y4.App = Backbone.View.extend({
		events: {
			"mousemove .player-layer": "showControls",
			"touchstart .player-layer": "showControls",
			"click .icon-play": "play",
			"click .icon-stop": "stop",
			"click .tap-start": "startUserPlaylist",
			"touchstart .tap-start": "startUserPlaylist",
		},
		initialize: function () {
			var that = this;
			this.router = new Router({ app: this });
			this.user = new y4.User();
			this.users = new y4.Users();
			this.users.add(this.user);
			this.player = new y4.PlayerView({ server: wowzaServer });

			FB.init({
				appId      : '424893924242103', // App ID from the App Dashboard
				channelUrl : '//'+window.location.hostname+'/channel.php', // Channel File for x-domain communication
				status     : true, // check the login status upon init?
				cookie     : true, // set sessions cookies to allow your server to access the session?
				xfbml      : true  // parse XFBML tags on this page?
			});

			$(document).on("touchstart", function (e) {
				e.preventDefault(); // Prevents scrolling
			});

			window.login = this;

			this.player.on("beforefinish", function () {
				that.playlist.fetchNext();
			}).on("finish", function () {
				// Check if the next programme/advert can still be shown at
				// this time (that no more than 5 seconds has elapsed since
				// beforefinish)
				if (that.playlist.nextHasExpired()) {
					that.playlist.fetchNext().then(function () {
						that.player.next();
					});
				} else {
					that.player.next();
				}
			});

		},
		render: function () {
			this.$el.html(y4.templates['your4-main']());
			this.$(".player-container").html("").append(this.player.render().el);
			return this;
		},
		start: function () {
			var that = this;
			this.render().showSpinner();

			this.user.set('id','me');
			this.user.fetch().done(function () {
				// User is logged in :)
				that.startNav();
			}).fail(function () {
				// Check to see if user is logged in via FB
				FB.getLoginStatus(function (response) {
					if (response.status === 'connected') {
						that.retrieveFbUser().then(function () {
							that.startNav();
						});
					} else if (response.status === 'not_authorized') {
						that.startNav();
						that.router.navigate("login", { trigger: true });
					} else {
						that.startNav();
						that.router.navigate("login", { trigger: true });
					}
				});
			});
			return this;
		},
		startNav: function() {
			this.hideSpinner();
			Backbone.history.start();
		},
		fbLogin: function () {
			var that = this,
				dfd = new $.Deferred();
			FB.login(function (response) {
				if (response.authResponse) {
					that.retrieveFbUser().then(function () {
						dfd.resolve();
					});
				}
			}, { scope: 'user_birthday,email' });
			return dfd;
		},
		// Crucial. Sets server side session and ensures user is registered.
		retrieveFbUser: function () {
			var that = this,
				dfd = new $.Deferred();
			FB.api('/me', function (response) {
				that.user.set('id', 'fb-' + response.id);
				that.user.fetch().then(function () {
					if (that.user.get("registered") == false) {
						that.hideSpinner();
						that.goRegisterFB(dfd);
					} else {
						dfd.resolve();
					}
				});
			});
			return dfd;
		},
		startUserPlaylist: function () {
			return this.router.navigate("play", { trigger: true });
		},
		showStartScreen: function () {
			this.$(".start-screen-layer").show();
			this.$(".player-layer").hide();
			return this;
		},
		goStart: function () {
			this.showStartScreen().$('.start-container')
				.html('<div class="tap-start"><b>Tap to start.</b></div>');
			return this;
		},
		goLogin: function () {
			var login = new y4.LoginView({ app: this });
			this.showStartScreen().$('.start-container').html("")
				.append(login.render().el);
			login.on("login", function (o) {
				o.username
				o.password
			}).on("facebookLogin", function () {

			});
			return this;
		},
		goRegisterFB: function (dfd) {
			this.goRegister({user: this.user}, dfd.resolve);
		},
		goRegister: function (data, callback) {
			var that = this;

			var register = new y4.RegisterView(data);
			this.showStartScreen().$('.start-container').html("")
				.append(register.render().el);

			register.on("register", function (user) {
				that.user = user;
				if (callback) {
					callback();
				} else {
					that.router.navigate("play", { trigger: true });
				}
			});
			return this;
		},
		goLogout: function () {
			var that = this;
			console.log("FFKL:");
			this.user.destroy().done(function(response) {
				that.router.navigate('login', { trigger: true });
			});
			return this;
		},
		goPlay: function (userId) {
			var that = this,
				playlist = new y4.Playlist({ user: this.user });

			this.showSpinner();

			playlist.start().then(function () {
				that.playlist = playlist;
				that.hideSpinner();
				that.$(".start-screen-layer").hide();
				that.$(".player-layer").show();
				that.play().showControls();

			});
			playlist.on("programme", function (programme) {
				that.player.setProgramme(programme);
			}).on("advert", function (advert) {
				that.player.setAdvert(advert);
			});

			return this;
		},
		showSpinner: function(opts) {
			opts = _.extend({
				lines: 13,
				length: 21,
				width: 4,
				speed: 1.4,
				color: '#fff',
				top: $(window).innerHeight() / 2
			}, opts);
			this.hideSpinner(); // Hide any existing spinner
			this.spinner = new Spinner(opts).spin($('#container')[0]);
		},

		hideSpinner: function(opts) {
			if (this.spinner) { this.spinner.stop(); }
		},

		showControls: function () {
			var that = this;
			if (!this.controlsAreShown) {
				this.$(".top-controls, .bottom-controls").fadeIn(200); // TODO switch to transit (or maybe not due to dequeue)
				this.controlsAreShown = true;
			}
			clearTimeout(this.hideControlsTimeout);
			this.hideControlsTimeout = setTimeout(function () {
				that.hideControls();
			}, 1500);
			return this;
		},

		hideControls: function () {
			this.$(".top-controls, .bottom-controls").dequeue().fadeOut(200);
			this.controlsAreShown = false;
			return this;
		},

		play: function () { this.player.play(); return this; },
		stop: function () { this.player.stop(); return this; },

	});

	var Router = Backbone.Router.extend({
		routes: {
			"": "start",
			"login": "login",
			"register": "register",
			"logout": "logout",
			"play/:id": "play",
			"play": "play"
		},
		initialize: function (options) { this.app = options.app; },
		start: function () {
			if (!this.app.user) {
				this.app.router.navigate("login", { trigger: true });
			} else {
				this.app.goStart();
			}
		},
		login: function () { this.app.goLogin(); },
		register: function () { this.app.goRegister(); },
		logout: function () { this.app.goLogout(); },
		play: function (id) {
			id = id || this.app.user.id;
			//if (!this.app.user) { return this.unauthorized(); };
			this.app.goPlay(id);
		},
		unauthorized: function () {},
		notfound: function () {}
	});

}(this.y4));
