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


	var scripts = ["js/Scene.js", "js/collections.js", "js/App.js", "js/VideoPlayer.js", "js/Player.js", "js/Media.js", "js/Overlay.js", "js/PersonalChannel.js"],
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
		
		FB.init({
			appId      : '424893924242103', // App ID from the App Dashboard
			channelUrl : '//'+window.location.hostname+'/channel.php', // Channel File for x-domain communication
			status     : true, // check the login status upon init?
			cookie     : true, // set sessions cookies to allow your server to access the session?
			xfbml      : true  // parse XFBML tags on this page?
		});

		var app = y4.app = new y4.App({
			server: "152.78.144.19:1935"
		});

		y4.router = new y4.Router();
		Backbone.history.start();
	});

	$(document).on("touchstart", function(e){ 
	    e.preventDefault(); 
	});

})(this);
