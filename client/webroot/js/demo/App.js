(function (y4) {
	//"use strict";

	var wowzaServer = "152.78.144.19:1935";

	y4.allowFacebookLogin = window.location.hostname.indexOf("your4.tv") > 0;

	y4.now = function () {
		return (new Date()).getTime() / 1000;
	};

	y4.startTimeHack = 50;

	y4.App = Backbone.View.extend({
		events: {
			"mousemove .player-layer": "showControls",
			"touchstart .player-layer": "showControls",
			"click .icon-play": "play",
			"click .icon-stop": "stop",
			"click .tap-start": "goPlay",
			"touchstart .tap-start": "startPlay",
			"click .tap-start": "startPlay",
			"touchstart .logout-btn": "logout",
			"click .logout-btn": "logout"
		},
		initialize: function () {
			var that = this;
			
			$.get('adverts.html').fail(function() {
				window.location.href = "adverts.html";
			});

			this.router = new Router({ app: this });
			this.users = new y4.Users();

			this.player = new y4.PlayerView({ server: wowzaServer });

			if (y4.allowFacebookLogin) {
				FB.init({
					appId      : '424893924242103', // App ID from the App Dashboard
					channelUrl : '//'+window.location.hostname+'/channel.php', // Channel File for x-domain communication
					status     : true, // check the login status upon init?
					cookie     : true, // set sessions cookies to allow your server to access the session?
					xfbml      : true  // parse XFBML tags on this page?
				});
			}

			// Prevents scrolling
			/*$(document).on("touchstart", function (e) {
				e.preventDefault();
			});*/

			this.player.on("beforefinish", function () {
				that.playlist.fetchNext();
			}).on("finish", function () {
					console.log("***AD2")
				// Check if the next programme/advert can still be shown at
				// this time (that no more than 5 seconds has elapsed since
				// beforefinish)
				if (that.playlist.nextHasExpired()) {
					that.playlist.fetchNext().then(function () {
						that.player.next();
					});
				} else {
					console.log("***AD3")
					that.player.next();
				}
			});

		},
		render: function () {
			this.$el.html(y4.templates['your4-main']());
			this.$(".player-container").append(this.player.render().el);
			return this;
		},
		start: function () {
			var that = this;
			this.render().showSpinner();

			$.when(this.users.fetchLoggedInUser(), this.player.load()).always(function () {
				that.startNav();
			});

			return this;
		},
		startNav: function() {
			this.hideSpinner();
			// Starts the router
			Backbone.history.start();
		},
		showStartScreen: function () {
			this.$(".start-screen-layer").show();
			this.$(".player-layer").hide();
			return this;
		},
		startPlay: function () {
			this.$(".start-screen-layer").hide();
			this.$(".player-layer").show();
			this.play().showControls();
			return this;
		},
		goPlay: function () {
			this.router.go("play");
			return this;
		},
		renderStart: function () {
			this.showStartScreen();
			return this;
		},
		renderLogin: function () {
			var that = this;
			var login = new y4.LoginView({ app: this });

			that.showStartScreen().$('.start-container').html("")
				.append(login.render().el);

			login.on("loggedIn", function () {
				that.hideSpinner();
				var user = that.user();
				if (user && user.get('registered')) {
					that.goPlay();
				} else {
					that.router.go("register");
				}
			});

			return this;
		},
		user: function () {
			return this.users.loggedIn();
		},
		renderRegister: function () {
			var that = this,
				register = new y4.RegisterView({ app: this });

			this.showStartScreen().$('.start-container').html("")
				.append(register.render().el);

			register.on("registered", function () {
				that.hideSpinner();
				that.goPlay();
			});

			return this;
		},
		renderLogout: function () {
			var that = this;
			this.users.logout().done(function(response) {
				that.router.navigate('login', { trigger: true });
			});
			return this;
		},
		renderPlay: function (userId) {
			var that = this,
				playlist = new y4.Playlist(undefined, { user: this.user(), demo: 1 });

			$('.account-controls .name').text("Welcome "+this.user().get('name'));

			this.showSpinner();

			this.player.setPlaylist(playlist);

			playlist.on("ready", function () {
				playlist.fill();
			});
			playlist.on("started", function () {
				console.log("Started");
				that.playlist = playlist;
				that.hideSpinner();
				that.showStartScreen().$('.start-container')
					.html('<div class="tap-start"><b>Tap to start.</b></div>');
			});

			playlist.on("broadcast", function (broadcast) {
				that.player.setBroadcast(broadcast);
			}).on("programme", function (programme) {
				that.player.setProgramme(programme);
			}).on("advert", function (advert) {
				that.player.setAdvert(advert);
			});

			return this;
		},
		renderRedirect: function () {
			window.location.replace("https://docs.google.com/spreadsheet/viewform?formkey=dFVqMDdKRlF6bTNEYWIxY1ptNFgzcVE6MQ#gid=0");
		},
		renderNotfound: function () {
			this.showStartScreen().$('.start-container').html(y4.templates["y4-notfound"]());
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

		showControls: function (e) {
			var that = this;
			if (!this.controlsAreShown) {
				this.$(".bottom-controls").transition({height: '80px'});
				this.$(".top-controls").transition({height: '40px'});
				$(".player .skip-layer .skip").transition({bottom: '90px'});
				this.controlsAreShown = true;
			}

			clearTimeout(this.hideControlsTimeout);

			var controlsFocused = e
					&& $(e.originalEvent.srcElement).parents('.bottom-controls, .top-controls').length
					&& e.type == 'mousemove';

			if (!controlsFocused) {
				this.hideControlsTimeout = setTimeout(function () {
					that.hideControls();
				}, 1500);
			}
			return this;
		},

		hideControls: function () {
			this.$(".bottom-controls, .top-controls").transition({height: '0px'});
			$(".player .skip-layer .skip").transition({bottom: '20px'});
			this.controlsAreShown = false;
			return this;
		},

		play: function () { this.player.play(); return this; },
		stop: function () { this.player.stop(); return this; },

		logout: function() {
			this.router.navigate('logout', { trigger: true });
		}

	});

	var Router = Backbone.Router.extend({
		routes: {
			"": "start",
			"login": "login",
			"register": "register",
			"logout": "logout",
			"play/:id": "play",
			"play": "play",
			"prestudy": "prestudy",
			"*notfound": "notfound"
		},
		initialize: function (options) { this.app = options.app; },
		start: function () {
			if (!this.app.users.loggedIn()) {
				if (this.app.users.first().get("registered") === false) {
					return this.go("register");
				}

				return this.go("login");
			}
			this.go("play");
		},
		login: function () {
			if (this.app.users.loggedIn()) { return this.go(""); }
			this.app.renderLogin();
		},
		register: function () {
			if (this.app.users.loggedIn()) { return this.go(""); }
			this.app.renderRegister();
		},
		logout: function () {
			this.app.renderLogout();
		},
		play: function (id) {
			if (!id && this.app.users.loggedIn()) {
				id = this.app.users.loggedIn().id;
			}
			if (!id) { return this.go("login"); }
			this.app.renderPlay(id);
		},
		prestudy: function () {
			this.app.renderRedirect();
		},
		go: function (hash) {
			return this.navigate(hash, { trigger: true });
		},
		notfound: function () {
			this.app.renderNotfound();
		}
	});

}(this.y4));
