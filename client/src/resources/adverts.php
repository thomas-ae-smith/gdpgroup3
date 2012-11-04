<?php


$app->get('/adverts(/)', function() use ($app) {
	$userId = $app->request()->get('user');
	$programmeId = $app->request()->get('programme');
	if ($userId && $programmeId) {
		$user = R::load('users', $userId);
		if (!$user->id) { return notFound('User with that ID not found.'); }
		$programme = R::load('programmes', $programmeId);
		if (!$programme->id) { return notFound('Programme with that ID not found.'); }
		unset($out);
		exec('python ../../../recommender/get_ad.py ' . $user->id . ' ' . $programme->id . ' ' . time(), $out);
		$advertId = $out[0];
		$advert = R::load('adverts', $advertId);
		output_json(array($advert->export()));
	} else {
		$adverts = R::find('adverts');
		output_json(R::exportAll($adverts));
	}
});

$app->get('/adverts/:id', function ($id) use ($app) {
	$advert = R::load('adverts', $id);
	if (!$advert->id) {
		notFound('Could not find advert with that ID.');
	} else {
		output_json($advert->export());
	}
});

$app->put('/adverts/:id', function ($id) use ($app) {
	$req = $app->request()->getBody();
	$advert = R::load('adverts', $id);
	setAdvert($advert, $req);
});

function setAdvert($advert, $req) {
	$advert->type = $req['type'];
	$advert->title = $req['title'];
	$advert->overlay = $req['overlay'];
	$advert->url = $req['url'];
	$advert->duration = $req['duration'];
	$advert->thumbnail = $req['thumbnail'];
	R::store($advert);
	output_json($advert->export());
}

$app->post('/adverts(/)', function () use ($app) {
	$req = $app->request()->getBody();
	$advert = R::dispense('adverts');
	setAdvert($advert, $req);
});

$app->delete('/adverts/:id', function ($id) use ($app) {
	$advert = R::load('adverts', $id);
	if (!$advert->id) {
		notFound('Could not find advert with that ID)');
	} else {
		R::trash($advert);
		noContent();
	}
});
