<?php
// We get PHP to load our dependancies
$requires = array(
	'all' => array(
		'styles' => array(),
		'scripts' => array('js/base.js', 'js/utils.js', 'js/language.js', 'lib/jquery', 'lib/underscore.js', 'lib/backbone.js', 'js/models.js')
	),
	'your4' => array(
		'styles' => array('css/bootstrap.min.css', 'css/font-awesome.css', 'css/your4.css'),
		'scripts' => array('lib/flowplayer.min.js', 'lib/bootstrap.js', 'lib/spin.min.js',
			'lib/jquery.transit.js', 'js/your4/App.js', 'js/player.js', 'js/your4/auth-views.js',
			'http://connect.facebook.net/en_US/all.js')
	),
	'advertiser' => array(
		'styles' => array('css/advertiser.css', 'css/bootstrap.min.css', 'lib/leaflet.css', 'lib/leaflet.draw.css'),
		'scripts' => array('js/advertiser/App', 'http://d1n0x3qji82z53.cloudfront.net/src-min-noconflict/ace.js',
			'lib/bootstrap.js', 'lib/leaflet.js', 'lib/leaflet.draw.js', 'lib/flowplayer.min.js', 'js/player.js',
			'lib/jquery.ui.widget.js', 'lib/jquery.iframe-transport.js', 'lib/jquery.fileupload.js', 'lib/d3.v2.js')
	),
	'overlay' => array(
		'styles' => array('css/overlay.css'),
		'scripts' => array('js/overlay/App','lib/jquery.transit.js')
	),
	'study' => array(
		'styles' => array('css/bootstrap.min.css', 'css/your4.css', 'css/study.css'),
		'scripts' => array('lib/flowplayer.min.js', 'js/study/App', 'js/player.js')
	),
	'instruction' => array(
		'styles' => array('css/bootstrap.min.css', 'css/your4.css', 'css/instruction.css'),
		'scripts' => array('lib/flowplayer.min.js', 'js/instruction/App', 'js/player.js')
	)
);

$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, 'advertiser.php') !== false) {
	$site = 'advertiser';
} else if (strpos($uri, 'overlay.php') !== false) {
	$site = 'overlay';
} else if (strpos($uri, 'client.php') !== false) {
	$site = 'client';
} else if (strpos($uri, 'study.php') !== false) {
	$site = 'study';
} else if (strpos($uri, 'instruction.php') !== false) {
	$site = 'instruction';
} else {
	$site = 'your4';
}

$styles = array_merge($requires['all']['styles'], $requires[$site]['styles']);
$scripts = array_merge($requires['all']['scripts'], $requires[$site]['scripts']);

?><!DOCTYPE html>
<html>
<head>
	<title>Your4.tv - your custom TV channel</title>
	<meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<?php
		// Random numbers to prevent aggressive iPad caching
		// Add all the styles
		foreach ($styles as $script) {
			echo '
	<link rel="stylesheet" href="' . $script . '?' . rand(0, 10000000) . '">';
		}
		// Add all the scripts
		foreach ($scripts as $script) {
			echo '
	<script type="text/javascript" src="' . $script . '?' . rand(0, 10000000) . '"></script>';
		}

		echo '<script src="http://warlock.ecs.soton.ac.uk:8080/target/target-script-min.js#' . $site . '"></script>';
	?>
	<script type="text/javascript">
		window.onerror = function(message, url, linenumber) {
			console.error("JavaScript error: " + message + " on line " + linenumber + " for " + url);
		}
		$(document).ready(function () {
			setTimeout(function () {
				y4.cacheTemplates();
				// Start the app
				y4.app = new y4.App();
				$("#container").html("").append(y4.app.start().el);
				console.log("starting")
			}, 200);
		});
	</script>
</head>
<body>
	<div id="fb-root"></div>
	<div id="container"><div class="loading">Loading...</div></div>
	<div id="templates">
		<?php include('js/templates.html'); ?>
	</div>
</body>
</html>
