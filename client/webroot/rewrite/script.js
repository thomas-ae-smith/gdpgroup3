var playlistJ = [
	{ type: "programme", id: 5152, duration: 40 },
	{ type: "advert", id: 138 },
	{ type: "advert", id: 139 },
	{ type: "advert", id: 140 }
]

$(document).ready(function () {
	var player = new Player({ server: "152.78.144.19:1935" }),
		playlist = new Playlist(playlistJ);

	$(".player").append(player.el);
	$(".skip").click(function () {
		if (player.current().get("type") === "advert") {
			$(".skip-options").show();
		} else {
			player.skip();
		}
	});
	$(".skip-options .option").click(function () {
		player.skip();
		$(".skip-options").hide();
	});

	player.setPlaylist(playlist);

	//player.on("ready", function () {
	//	console.log(playlist)
	$(".login form").submit(function (e) {
		e.preventDefault();
		player.start(37);
		$(".login").hide();
		return false;
	});
	//});
})

var Player = Backbone.View.extend({
	render: function (time) {
		$(this.el).html("").flowplayer({
			src: "../lib/flowplayer.swf",
			wmode: "opaque"
		}, {
			clip: {
				url: 'mp4:' + this.url,
				scaling: "fit",
				start: time,
				provider: 'y4',
				autoPlay: true,
				autoBuffering: true,
				accelerated: true,
				onStart: function () {
					that.trigger("start", that.$f.getClip().metaData);
				},
				onFinish: function () {
					that.trigger("finish");
				}
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
		console.log(this.service, this.url);;
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
			total += Number(item.get("duration"));
			timeouts.push(setTimeout(function () {
				that.i++;
				that.playItem(i + 1);
			}, total * 1000))
		});

		this.playItem(0, time);
	},
	playItem: function (i, time) {
		if (i >= this.playlist.length) { return; }
		var item = this.playlist.at(i);
		this.set("vod", item.model.uri(), time);
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
			that.trigger("ready");
		});
		this.playlist = playlist;
	},
	current: function () {
		return this.playlist.at(this.i);
	}
})


var PlaylistItem = Backbone.Model.extend({
	load: function () {
		var that = this,
			dfd = $.Deferred();
		switch (this.get("type")) {
		case "programme":
			this.model = new Programme(this.toJSON());
			break;
		case "advert":
			this.model = new Advert(this.toJSON());
			break;
		}
		this.model.fetch().then(function () {
			if (!that.get("duration") && that.model.get("duration")) {
				that.set({ duration: that.model.get("duration") });
			}
			dfd.resolve();
		});
		return dfd;
	}
})

var Playlist = Backbone.Collection.extend({
	model: PlaylistItem
});


var Programme = Backbone.Model.extend({
	url: function () {
		return "http://www.your4.tv/api/programmes/" + this.id;
	},
	uri: function () { return "prog-" + this.get("uid").replace(/[^a-zA-Z0-9\s\p{P}]/g, '') + ".mp4"; }
});

var Advert = Backbone.Model.extend({
	url: function () {
		return "http://www.your4.tv/api/adverts/" + this.id;
	},
	uri: function () { return this.get("url"); }
});