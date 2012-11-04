(function (y4) {
	"use strict";

	var server = "152.78.144.19:1935";

	y4.App = Backbone.View.extend({
		events: {
			"mousemove": "showOverlay",
			"touchstart": "showOverlay",
			"click .icon-play": "play",
			"click .icon-stop": "stop"
		},
		initialize: function () {
			var that = this;

			this.login = new y4.Login();
			this.showSpinner();
			//this.player = new y4.PlayerView({ server: server });
			this.adverts = new y4.Adverts();
			this.channels = new y4.Channels();
			this.programmes = new y4.Programmes();

			$.when(this.adverts.fetch()/*, this.channels.fetch()*/, this.programmes.fetch()).then(function () {

			});

			//this.channelCollection = new y4.Channels(undefined, { player: this.player });
			//this.vodCollection = new y4.VODCollection(undefined, { player: this.player });
			//this.programmeCollection = new y4.ProgrammeCollection(undefined, {
			//	channelCollection: this.channelCollection,
			//	vodCollection: this.vodCollection
			//});

			//this.personalChannel = new y4.PersonalChannel({
			//	advertCollection: this.advertCollection,
			//	programmeCollection: this.programmeCollection
			//});

			//this.on("start", function () {
			//	that.personalChannel.start();
			//});

			/*FB.init({
				appId      : '424893924242103', // App ID from the App Dashboard
				channelUrl : '//'+window.location.hostname+'/channel.php', // Channel File for x-domain communication
				status     : true, // check the login status upon init?
				cookie     : true, // set sessions cookies to allow your server to access the session?
				xfbml      : true  // parse XFBML tags on this page?
			});*/

			y4.router = new Router();
			// Wait until App has initialised before starting
			_.defer(function () {
				Backbone.history.start();
			});

			$(document).on("touchstart", function(e){
			    e.preventDefault();
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
			//this.$el.append(this.player.render().el);
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


	var Router = Backbone.Router.extend({

		routes: {
			"":	"default"
		},

		default: function() {
			y4.viewManager.showView(y4.app);
		}

	});


	y4.viewManager = {
		showView: function(view) {
			$('#container').html(view.render().el);
		}
	}

}(this.y4));
