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
			this.users = new y4.Users();
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

			// HACK
			this.user = new y4.User({
				id: 8,
				name: "never do this"
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

			var fetchUserDfd = new $.Deferred(),
				user = new y4.User({ id: 'me' });

			this.users.add(user);

			user.fetch().done(function () {
				// User is logged in :)
				that.user = user;
				fetchUserDfd.resolve();
			}).fail(function () {
				// Check to see if user is logged in via FB
				FB.getLoginStatus(function (response) {
					if (response.status === 'connected') {
						that.retrieveFbUser().then(function () {
							fetchUserDfd.resolve();
						});
					} else {
						fetchUserDfd.resolve();
					}
					/*else if (response.status === 'not_authorized') {
						that.facebookLoggedIn = false;
						y4.app.hideSpinner();
						that.renderLogin();
					} else {
						that.facebookLoggedIn = false;
						y4.app.hideSpinner();
						that.renderLogin();
					}*/
				});
				setTimeout(function () { // HACK, no (documented) way to tell if FB.getLoginStatus has failed
					console.log("Resorting to hack");
					fetchUserDfd.resolve();
				}, 2000);
			});
			$.when(fetchUserDfd).done(function () {
				that.hideSpinner();
				Backbone.history.start();
			}).fail(function () {
				that.$el.html('<div class="alert alert-error" style="width: 700px; margin: 40px auto;"><b>Error while loading page.</b></div>')
			});
			return this;
		},
		fbLogin: function () {
			var that = this,
				dfd = new $.Deferred();
			FB.login(function (response) {
				if (response.authResponse) {
					that.facebookLoggedIn = true;
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
				var user = new y4.User({ id: 'fb-' + response.id });
				that.users.add(user);
				user.fetch().then(function () {
					if (user.get("registered")) {
						that.user = user
					} else {
						//that.renderReg(undefined, that.userModel);
					}
					dfd.resolve();
				});
			});
			return dfd;
		},
		startUserPlaylist: function () {
			return this.goPlay(this.user.id);
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
		goRegister: function () {
			var register = new y4.RegisterView();
			this.showStartScreen().$('.start-container').html("")
				.append(register.render().el);
			register.on("register", function () {

			});
			return this;
		},
		goLogout: function () {
			this.user.destroy().then(function(response) {
				if (response === "success") {
					this.navigate('', { trigger: true });
				}
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
				console.log(programme)
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
			"play/:id": "play"
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
			//if (!this.app.user) { return this.unauthorized(); };
			this.app.goPlay(id);
		},
		unauthorized: function () {},
		notfound: function () {}
	});

}(this.y4));
