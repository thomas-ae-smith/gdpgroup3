<?php

$app->get('/occupations(/)', function() use ($app) {
	$occupations = R::find('occupation');
	output_json(array_map('getOccupation', array_values($occupations)));
});

$app->get('/occupations/:id', function($id) use ($app) {
	$occupation = R::load('occupation', $id);
	if (!$occupation->id) { notFound('Occupation with that ID not found.'); }
	output_json(getOccupation($occupation));
});

function getOccupation($occupation) {
	return $occupation->export();
}
