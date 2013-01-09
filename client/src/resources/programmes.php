<?php

$demo_programmes = array(5152, 1085, 1187, 583, 1393, 1186);

$app->get('/programmes(/)', function() use ($app, $demo_programmes) {
	$demo = $app->request()->get('demo');
	if ($demo) {
		$programme = R::load('programme', $demo_programmes[$demo - 1]);
		if (!$demo) {
			notFound('No more demo programmes');
		}
		output_json(getProgramme($programme));
		return;
	}
	$userId = $app->request()->get('user');
	if ($userId) {
		$user = R::load('user', $userId);
		if (!$userId) {
			return notFound('User with that ID not found.');
		}
		unset($out);
		exec('python ../../../recommender/get_vod_recommendation.py ' . $user->id, $out);

		$programmeId = $out[0]; // Replace with 0 once get_recommender is fixed
		$programme = R::load('programme', $programmeId);
		if (!$programme) {
			notFound('No suitable recommendation at the moment - try again soon.');
		}

		exec('python ../../../recommender/add_blacklist_programme.py ' . $user->id . ' ' . $programme->id);

		output_json(getProgramme($programme));
	} else {
		$programmes = R::find('programme');
		output_json(array_map(function ($programme) {
			return array(
				'id' => $programme->id,
				'title' => $programme->title
			);
		}, array_values($programmes)));
	}
});

$app->get('/programmes/:id', function ($id) use ($app) {
	$programme = R::load('programme', $id);
	if (!$programme) { return notFound('Programme with that ID not found.'); }
	output_json(getProgramme($programme));
});

$app->post('/programmes/:id/rate/', function ($id) {
	$req = $app->request()->getBody();
	$rating = min(1, max(-1, floatval($req['rating'])));
	$programme = R::load('programme', $id);
	if (!$programme) { return notFound('Programme with that ID not found.'); }
	exec('python ../../../recommender/add_rating.py ' . $user->id . ' ' . $programme->id . ' ' . $rating);
	output_json(array(
		'rating' => $rating
	));
});

function getProgramme($programme) {
	$brand = $programme->brand;
	return array_merge($programme->export(), array(
		'url' => programmeUrl($programme),
		'adbreaks' => array_map(function ($adbreak) {
			return array(
				'id' => $adbreak->id,
				'startTime' => $adbreak->startTime,
				'endTime' => $adbreak->endTime
			);
		}, array_values($programme->ownAdbreak)),
		'fulltitle' => ($brand->title !== $programme->title ? $brand->title . ' - ' : '') . $programme->title
	));
};

