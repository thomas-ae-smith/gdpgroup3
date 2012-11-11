<?php

// Advert collection
$app->get('/adverts(/)', function() use ($app) {
	$userId = $app->request()->get('user');
	$programmeId = $app->request()->get('programme');
	// If a user and programme is provided, provide one advert that is most suitable for them
	if ($userId && $programmeId) {
		$user = R::load('user', $userId);
		$programme = R::load('programme', $programmeId);
		if (!$user->id) { return notFound('User with that ID not found.'); }
		if (!$programme->id) { return notFound('Programme with that ID not found.'); }
		unset($out);
		exec('python ../../../recommender/get_ad.py ' . $user->id . ' ' . $programme->id . ' ' . time(), $out);
		$advertId = $out[0];
		$advert = R::load('advert', $advertId);
		if (!$advert->id) { return notFound('No suitable recommendation.'); }
		output_json(array(getAdvert($advert)));
	} else {
		$adverts = R::find('advert');
		output_json('getAdvert', $adverts);
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
	return $advert->export();
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