<?php

$app->get('/programmes(/)', function() use ($app) {
	$programmes = R::find('programmes');
	output_json(array_map(function ($programme) {
		return array(
			'id' => $programme->id,
			'name' => $programme->name
		);
	}, array_values($programmes)));
	//output_json(R::exportAll($programmes));
});
