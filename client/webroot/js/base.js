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
		var channels = y4.channels = {
			"c4": new y4.Channel({ title: "Channel 4", url: "c4", icon: "img/ids/c4.svg" }),
			"e4": new y4.Channel({ title: "E4", url: "e4", icon: "img/ids/e4.svg" }),
			"m4": new y4.Channel({ title: "More4", url: "m4", icon: "img/ids/more4.svg" }),
			"f4": new y4.Channel({ title: "Film4", url: "film4", icon: "img/ids/film4.svg" }),
			"4music": new y4.Channel({ title: "4music", url: "4music", icon: "img/ids/4music.svg" }),
			"stv": new y4.Channel({ title: "studentTV", url: "studentTV", icon: "img/ids/studenttv.svg" })
		};
		var app = y4.app = new y4.App({
			server: "152.78.144.19:1935/your4",
			channels: channels,
			channelsOrdered: [channels["c4"], channels["e4"], channels["m4"], channels["f4"], channels["4music"], channels["stv"]]
		});

		app.on("start", function () {
			var logoFrame = new y4.StillScene({ image: "img/logo-frame.png" });
			app.setPlaylist([
				{ scene: channels["c4"] },
				// Program break -> sponser message, c4 promo ad and channel sting should still be included
				//{ scene: logoFrame, duration: 2000 },
				//{ scene: new y4.StillScene({ text: "Some advert" }), duration: 2000 },
				//{ scene: new y4.StillScene({ text: "Another advert" }), duration: 2000 },
				//{ scene: new y4.StillScene({ text: "Yet another advert" }), duration: 2000 },
				//{ scene: channels["c4"] }
			]);
		});

		$('#container').html("").append(app.render().el);
	});

	$(document).on("touchstart", function(e){ 
	    e.preventDefault(); 
	});

})(this);
