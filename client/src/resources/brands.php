<?php

$app->get('/brands(/)', function() use ($app) {
	$userId = $app->request()->get('brand');
	$brands = R::find('brand');
	output_json(array_map(function ($brand) {
		return array(
			'id' => $brand->id,
			'title' => $brand->title,
			'noOfProgrammes' => count($brand->ownProgramme)
		);
	}, array_values($brands)));
});

$app->get('/brands/:id', function ($id) use ($app) {
	$brand = R::load('brand', $id);
	if (!$brand) { return notFound('Brand with that ID not found.'); }
	output_json($brand);
});

