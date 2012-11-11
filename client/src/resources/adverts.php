<?php

// Advert collection
$app->get('/adverts(/)', function() use ($app) {
	$userId = intval($app->request()->get('user'));
	$programmeId = intval($app->request()->get('programme'));
	$timeLimit = intval($app->request()->get('time_limit'));
	if (!$timeLimit) { $timeLimit = 0; }
	if (!$programmeId) { $programmeId = 0; }
	// If a user and programme is provided, provide one advert that is most suitable for them
	if ($userId) {
		$user = R::load('user', $userId);
		$programme = R::load('programme', $programmeId);
		if (!$user->id) { return notFound('User with that ID not found.'); }
		if ($programmeId !== 0 && !$programme->id) { return notFound('Programme with that ID not found.'); }
		unset($out);
		exec('python ../../../recommender/get_ad.py ' . $user->id . ' ' . $programme->id . ' ' . $timeLimit . ' ' . time(), $out);
	//	echo('python ../../../recommender/get_ad.py ' . $user->id . ' ' . $programme->id . ' ' . $timeLimit . ' ' . time());
	//	var_dump($out);
		$advertId = $out[0];
		$advert = R::load('advert', $advertId);
		if (!$advert->id) { return notFound('No suitable recommendation.'); }
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

function getAdvert($advert) {
	return array_merge($advert->export(), array(
		'campaigns' => array_map('getCampaignSummary', array_values($advert->sharedCampaign))
	));
}

function getCampaignSummary($campaign) {
	return $campaign->export();
}

function setAdvert($advert, $req) {
	$advert->type = $req['type'];
	$advert->title = $req['title'];
	$advert->overlay = $req['overlay'];
	$advert->url = $req['url'];
	$advert->duration = $req['duration'];
	$advert->thumbnail = $req['thumbnail'];
	R::store($advert);
	output_json(getAdvert($advert));
}
