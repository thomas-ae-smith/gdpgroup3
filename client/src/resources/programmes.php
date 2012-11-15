<?php

$app->get('/programmes(/)', function() use ($app) {
	$userId = $app->request()->get('user');
	if ($userId) {
		$programme = R::load('programme', 1); // TODO
		output_json($programme->export());
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
	output_json(array_merge($programme->export(), array(
		'adbreaks' => array_map(function ($adbreak) {
			return array(
				'id' => $adbreak->id,
				'startTime' => $adbreak->startTime,
				'endTime' => $adbreak->endTime
			);
		}, array_values($programme->ownAdbreak))
	)));
});

