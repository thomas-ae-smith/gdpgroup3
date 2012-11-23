<?php

// Advert collection
$app->get('/adverts(/)', function() use ($app) {
	$userId = intval($app->request()->get('user'));
	$programmeId = intval($app->request()->get('programme'));
	$timeLimit = intval($app->request()->get('time_limit'));
	$excludeAdvertIds = $app->request()->get('exclude_adverts');
	$live = $app->request()->get('live');
	if (!$timeLimit) { $timeLimit = 0; }
	if (!$programmeId) { $programmeId = 0; }
	// If a user and programme is provided, provide one advert that is most suitable for them
	if ($userId) {
		$user = R::load('user', $userId);
		$programme = R::load('programme', $programmeId);
		$exclude = $excludeAdvertIds ? explode(',', $excludeAdvertIds) : array();
		if (!$user->id) { return notFound('User with that ID not found.'); }
		if ($programmeId !== 0 && !$programme->id) { return notFound('Programme with that ID not found.'); }
		unset($out);
		exec('python ../../../recommender/get_ad.py ' . $user->id . ' ' . $programme->id . ' ' . 
			$timeLimit . ' ' . time() . ($exclude ? ' -x ' . implode(' ', $exclude) : '') . 
			($live ? ' -l' : ''), $out);

		$advertId = $timeLimit > 10 ? $out[0] : 0;// $out[0];
		$advert = R::load('advert', $advertId);

		if (!$advert->id) {
			$advert = R::findOne('advert', ' duration < ? ORDER BY RAND() ', array($timeLimit));
		}
		if (!$advert->id) {
			notFound('No suitable recommendation.');
		}
		output_json(array(getAdvert($advert)));
	} else {
		$adverts = R::find('advert');
		output_json(array_map('getAdvert', array_values($adverts)));
	}
});

// Get an advert
$app->get('/adverts/:id', function ($id) use ($app) {
	$advert = R::load('advert', $id);
	if (!$advert->id) { notFound('Could not find advert with that ID.'); }
	output_json(getAdvert($advert));
});

// Change and advert
$app->put('/adverts/:id', function ($id) use ($app) {
	$req = $app->request()->getBody();
	$advert = R::load('advert', $id);
	if (!$advert->id) { notFound('Could not find advert with that ID.'); }
	setAdvert($advert, $req);
});

// Create an advert
$app->post('/adverts(/)', function () use ($app) {
	$req = $app->request()->getBody();
	$advert = R::dispense('advert');
	setAdvert($advert, $req);
});

// Delete an advert
$app->delete('/adverts/:id', function ($id) use ($app) {
	$advert = R::load('advert', $id);
	if (!$advert->id) { notFound('Could not find advert with that ID.'); }
	R::trash($advert);
	noContent();
});

$app->get('/advert-refresh', function () use ($app) {
    $conn = ftp_connect('152.78.144.19');
	$login = ftp_login($conn, 'adSoton', 'MountainDew2012');
	if (!$conn || !$login) { internalError('Unable to connect to advert server.'); }
	@unlink('/tmp/tmp.mp4');
	$files = array_walk(array_map(function ($file) {
		return substr($file, 2);
	}, array_filter(ftp_nlist($conn, '.'), function ($file) {
		return (endsWith($file, '.mp4') || endsWith($file, '.f4v')) && !startsWith($file, './prog-');
	})), function ($file) use ($conn) {
		$advert = R::findOne('advert', ' url = ? ', array($file));
		if (!$advert) {
			$advert = R::dispense('advert');
			$advert->type = 'video';
			$advert->url = $file;
			$advert->title = $file;
		}
		if ($advert->thumbnail) { return; }

		// Download the file
		$get = ftp_get($conn, '/tmp/tmp.mp4', $file, FTP_BINARY);
		if (!$get) { echo 'Failed on ' . $file; }
		
		@$video = new ffmpeg_movie('/tmp/tmp.mp4');
		$thumbnailPath = findAvailableName('../../webroot/img/thumbs/videos/' . $file);
		$thumbnail = generateVideoThumbnail($thumbnailPath, $video);

		$advert->thumbnail = $thumbnail;
		$advert->duration = $video->getDuration();
		$advert->overlay = '';

		unlink('/tmp/tmp.mp4');

		R::store($advert);
	});

	die();
	ftp_close($conn);
});

function getAdvert($advert) {
	return array_merge($advert->export(), array(
		'campaigns' => array_map('getCampaignSummary', array_values($advert->sharedCampaign))
	));
}

function getCampaignSummary($campaign) {
	return $campaign->export();
}

function setAdvert($advert, $req) {
	$params = array('type', 'title', 'overlay', 'url', 'duration', 'thumbnail');
	array_walk($params, function ($param) use ($req) {
		if (!isset($req[$param])) {
			badRequest('Field "' . $param . '" must be provided.');
		}
	});
	$advert->type = $req['type'];
	$advert->title = $req['title'];
	$advert->overlay = $req['overlay'];
	$advert->url = $req['url'];
	$advert->duration = $req['duration'];
	$advert->thumbnail = $req['thumbnail'];
	R::store($advert);
	output_json(getAdvert($advert));
}

function startsWith($haystack, $needle) {
    return !strncmp($haystack, $needle, strlen($needle));
}

function endsWith($haystack, $needle) {
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }
    return (substr($haystack, -$length) === $needle);
}
