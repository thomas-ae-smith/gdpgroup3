<?php

$app->get('/programmes(/)', function() use ($app) {
	$programmes = R::find('programme');
	output_json(array_map(function ($programme) {
		return array(
			'id' => $programme->id,
			'title' => $programme->title
		);
	}, array_values($programmes)));
});

$app->get('/programmes/:id', function ($id) use ($app) {
	$programme = R::load('programme', $id);
	if (!$programme) { return notFound('Programme with that ID not found.'); }
	output_json($programme->export());
});

