<?php

$app->get('/genres(/)', function() use ($app) {
	$genres = R::find('genre');
	output_json(array_map(function ($genre) {
		$category = R::load('genrecategory', $genre->genrecategory_id);
		return array(
			'id' => $genre->id,
			'code' => $genre->code,
			'name' => $genre->name,
			'category' => array(
				'id' => $category->id,
				'name' => $category->name
			)
		);
	}, array_values($genres)));
});
