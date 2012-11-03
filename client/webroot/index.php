<?php
	//var scripts = ["js/Scene.js", "js/collections.js", "js/App.js", "js/VideoPlayer.js", "js/Player.js", "js/Media.js", "js/Overlay.js", "js/PersonalChannel.js"],
//http://warlock.ecs.soton.ac.uk:8080/target/target-script-min.js#anonymous

// We get PHP to load our dependancies
$requires = array(
	'all' => array(
		'styles' => array(),
		'scripts' => array('lib/jquery', 'lib/underscore.js', 'lib/backbone.js', 'js/base')
	),
	'your4' => array(
		'styles' => array('css/bootstrap.min.css', 'css/font-awesome.css', 'css/style.css'),
		'scripts' => array('lib/flowplayer.min.js', 'lib/bootstrap.js', 'lib/spin.min.js',
			'http://connect.facebook.net/en_US/all.js', 'js/apps/Your4')
	),
	'advertiser' => array(
		'styles' => array('css/bootstrap.min.css'),
		'scripts' => array('js/apps/Advertiser')
	),
	'overlay' => array(
		'styles' => array(),
		'scripts' => array('js/apps/Overlay')
	)
);

$htmlVideoBrowsers = array('iPad');

$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, 'publisher.html') !== false) {
	$site = 'advertiser';
} else if (strpos($uri, 'overlay.html') !== false) {
	$site = 'overlay';
} else {
	$site = 'your4';
}

$styles = $requires['all']['styles'] + $requires[$site]['styles'];
$scripts = $requires['all']['scripts'] + $requires[$site]['scripts'];

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
	?>
	<script type="text/javascript">
		// Start the app
		new y4.App();
	</script>
</head>
<body>
	<div id="fb-root"></div>
	<div id="container"><div class="loading">Loading...</div></div>
	<div class="templates">
		<?php include('js/templates.html'); ?>
	</div>
</body>
</html>
