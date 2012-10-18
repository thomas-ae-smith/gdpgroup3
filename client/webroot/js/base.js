function htmlEscape(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

(function(root) {
	"use strict";

	var y4 = root.y4 = {};


	var scripts = ["js/App.js", "js/Scene.js", "js/Video.js", "js/Player.js"],
		styles = ["css/style.css"];

	var htmlVideoBrowsers = ["iPad"];

	if (navigator.userAgent.indexOf("iPad") > -1) {
		y4.browser = "iPad";
	} else {
		y4.browser = "unknown";
	}
	
	// Should HTML5 videos be used?
	y4.useHtmlVideo = htmlVideoBrowsers.indexOf(y4.browser) > -1;

	_.each(scripts, function (script, i) {
		document.write('<script type="text/javascript" src="' + script + '?' + Math.round(Math.random() * 10000000) + '"></script>'); 
	});
	_.each(styles, function (style) {
		document.write('<link type="text/css" rel="stylesheet" href="' + style + '?' + Math.round(Math.random() * 10000000) + '">');
	});

	y4.now = function () {
		return (new Date()).getTime();
	}

	y4.error = function (msg) {
		console.error(msg)
	}


	$(document).ready(function () {
		var channelData = [
			{ id: "c4", title: "Channel 4", service: "your4", url: "c4.stream", icon: "img/ids/c4.svg" },
			{ id: "e4", title: "E4", service: "your4", url: "e4.stream", icon: "img/ids/e4.svg" },
			{ id: "m4", title: "More4", service: "your4", url: "m4.stream", icon: "img/ids/more4.svg" },
			{ id: "f4", title: "Film4", service: "your4", url: "film4.stream", icon: "img/ids/film4.svg" },
			{ id: "4music", title: "4music", service: "your4", url: "4music.stream", icon: "img/ids/4music.svg" },
			{ id: "stv", title: "studentTV", service: "your4", url: "studentTV.stream", icon: "img/ids/studenttv.svg" }
		];

		var advertData = [
			{ id: "guinness", type: "video", service: "vod", url: "ad-guinness.mp4" },
			{ id: "gocompare", type: "video", service: "vod", url: "ad-gocompare.mp4" },
			{ id: "justdance", type: "video", service: "vod", url: "ad-justdance.mp4" },
			{ id: "stags", type: "still", url: "img/stags-promo.jpg", duration: 3000 },
			{ id: "your4-sting", type: "still", url: "img/logo-frame.png", duration: 1000 }
		];

		var channels = _.map(channelData, function (channel) {
			return new y4.Channel({
				id: channel.id,
				title: channel.title,
				icon: channel.icon,
				media: new y4.Video({
					service: channel.service,
					url: channel.url
				})
			});
		});
		
		var adverts = _.map(advertData, function (advert) {
			var media;
			if (advert.type === "video") {
				media = new y4.Video({ service: advert.service, url: advert.url });
			} else if (advert.type === "still") {
				media = new y4.Still({ url: advert.url, duration: advert.duration });
			} else {
				y4.error("Invalid advert type");
			}
			return new y4.Advert({
				id: advert.id,
				media: media,
				overlay: null
			});
		})

		var app = y4.app = new y4.App({
			server: "152.78.144.19:1935",
			channels: channels,
			adverts: adverts
		});

		//app.on("start", function () {
		//});

		$('#container').html("").append(app.render().el);
	});

	$(document).on("touchstart", function(e){ 
	    e.preventDefault(); 
	});

})(this);
