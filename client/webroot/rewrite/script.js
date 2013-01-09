(function ($, _, Backbone, moment) {
	'use strict';

	var playlistJ = [
		{ type: 'programme', pid: 5152, duration: 52, addTime: 850 },
		{ type: 'advert', pid: 125 },
		{ type: 'advert', pid: 91 },
		{ type: 'advert', pid: 91 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 125 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 140 },
		{ type: 'advert', pid: 139 },
		{ type: 'programme', pid: 5152, duration: 900 },
		{ type: 'advert', pid: 125 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 125 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 140 },
		{ type: 'advert', pid: 140 },
		{ type: 'programme', pid: 5132, duration: 900 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 125 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 140 },
		{ type: 'programme', pid: 5132, duration: 900 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 125 },
		{ type: 'advert', pid: 139 },
		{ type: 'advert', pid: 140 },
		{ type: 'advert', pid: 140 },
		{ type: 'programme', pid: 5129, duration: 900 },
		{ type: 'advert', pid: 140 }
	];

	$(document).ready(function () {
		var player = new Player({ server: '152.78.144.19:1935' }),
			playlist = new Playlist(playlistJ);

		$('.player').append(player.el);
		$('.skip').click(function () {
			if (player.current().get('type') === 'advert') {
				$('.skip-options').show();
			} else {
				player.skip();
			}
		});
		$('.skip-options .option').click(function () {
			player.skip();
			$('.skip-options').hide();
		});

		player.setPlaylist(playlist);

		player.on('ready', function () {
			$('.loading-screen').hide();
		});

		$('.facebook-button').click(function (e) {
			e.preventDefault();
			player.start(0);
			$('.login').hide();
			return false;
		});

		$('.login form').submit(function (e) {
			e.preventDefault();
			player.start(0);
			$('.login').hide();
			return false;
		});


		$('.star').click(function () {
			var i = $(this).attr('data-val');
			$('.star').each(function (i2) {
				$(this).toggleClass('active', i2 < i);
			});
			var $thanks = $('<div class="thanks">Thanks!</div>').css({
				color: 'white',
				fontSize: 14
			});
			$('.star').fadeOut(function () {
				$('.star').eq(0).after($thanks.delay(2000).fadeOut());
			}).after();
		});
	});

	var Player = Backbone.View.extend({
		initialize: function () {
			var that = this;
			setInterval(function () {
				that.tick();
			}, 1000);
		},
		render: function (time) {
			$(this.el).html('').flowplayer({
				src: '../lib/flowplayer.swf',
				wmode: 'opaque'
			}, {
				clip: {
					url: 'mp4:' + this.url,
					scaling: 'fit',
					start: time,
					provider: 'y4',
					autoPlay: true,
					autoBuffering: true,
					accelerated: true,
					onStart: function () {},
					onFinish: function () {}
				},
				plugins: {
					y4: {
						url: '../lib/flowplayer.rtmp.swf',
						netConnectionUrl: 'rtmp://' + this.options.server + '/' + this.service
					},
					controls: null
				},
				canvas: {
					background: '#ff0000',
					backgroundGradient: 'none'
				}
			});
			console.log(this.service, this.url);
		},
		start: function (time, si) {
			_.each(this.timeouts, function (timeout) {
				clearTimeout(timeout);
			});
			var that = this,
				timeouts = this.timeouts = [],
				total = -time;

			si = this.i = si || 0;

			this.playlist.reset(this.playlist.models.slice(si));

			this.playlist.each(function (item, i) {
				if (i < si) { return; }
				total += Number(item.get('duration'));
				timeouts.push(setTimeout(function () {
					that.next();
				}, total * 1000));
			});

			this.playItem(0, time);
		},
		next: function () {
			this.i++;
			this.playItem(this.i);
			this.playlist.reset(this.playlist.models.slice(1));
		},
		playItem: function (i, time) {
			if (i >= this.playlist.length) { return; }
			var item = this.playlist.at(i);
			this.set('vod', item.model.uri(), time);
			$('.star').removeClass('active');
			if (item.get('type') === 'advert') {
				$('iframe').attr('src', 'overlay.html?' + Math.ceil(Math.random() * 1000000) + '#' + item.get('pid'));
				$('.rating').hide();
			} else {
				$('iframe').attr('src', 'about:blank');
				$('.rating').show();
				$('.star').show().siblings().find('.thanks').remove();
			}
			this.time = time ||  + (item.get('addTime') || 0);
		},
		skip: function () {
			this.start(0, this.i + 1);
		},
		set: function (service, url, time) {
			this.service = service;
			this.url = url;
			this.render(time);
		},
		setPlaylist: function (playlist) {
			var that = this,
				dfds = [];
			playlist.each(function (item) {
				dfds.push(item.load());
			});
			$.when.apply(null, dfds).then(function () {
				that.trigger('ready');
			});
			this.playlist = playlist;
		},
		current: function () {
			return this.playlist.at(this.i);
		},
		tick: function () {
			this.time += 1;
			var displayTime = 3600,
				time = this.time;
			$('.playlist .now-line').css({
				left: (time / displayTime) * 100 + '%'
			});
			$('.playlist .playlist-item').remove();

			var now = (new Date()).getTime() / 1000;

			var total = 0,
				totalTime = -time;

			this.playlist.each(function (item) {
				var itemj = item.toJSON(),
					width = ((itemj.duration + (itemj.addTime || 0)) / displayTime) * 100;

				var m = _.extend(item.model.toJSON(), itemj, {
					startTime: now + totalTime - itemj.addTime,
					endTime: now + totalTime + itemj.duration
				});

				m.startTimeStr = moment(m.startTime * 1000).format('HH:mm');
				m.endTimeStr = moment(m.endTime * 1000).format('HH:mm');

				var templateHTML = itemj.type === 'advert' ?
					$('#template-ad-playlist-item').html() :
					$('#template-playlist-item').html();

				var template = _.template(templateHTML),
					$item = $(template(m)).css({
						width: width + '%',
						left: total + '%'
					});
				$('.playlist').append($item);
				total += width;
				totalTime += Number(itemj.duration);
			});
		}
	});


	var PlaylistItem = Backbone.Model.extend({
		load: function () {
			var that = this,
				dfd = $.Deferred(),
				json = this.toJSON();
			_.extend(json, {
				id: json.pid
			});
			switch (this.get('type')) {
			case 'programme':
				this.model = new Programme(json);
				break;
			case 'advert':
				this.model = new Advert(json);
				break;
			}
			this.model.fetch().then(function () {
				if (!that.get('duration') && that.model.get('duration')) {
					that.set({ duration: that.model.get('duration') });
				}
				dfd.resolve();
			});
			return dfd;
		}
	});

	var Playlist = Backbone.Collection.extend({
		model: PlaylistItem
	});


	var Programme = Backbone.Model.extend({
		url: function () {
			return 'http://www.your4.tv/api/programmes/' + this.id;
		},
		uri: function () { return this.get('url'); }
	});

	var Advert = Backbone.Model.extend({
		url: function () {
			return 'http://www.your4.tv/api/adverts/' + this.id;
		},
		uri: function () { return this.get('url'); }
	});
}(this.jQuery, this._, this.Backbone, this.moment));


/*
'prog-' + this.get('uid').replace(/[^a-zA-Z0-9\s\p{P}]/g, '') + '.mp4';
*/
