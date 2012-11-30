<?php

$app->get('/studies(/)', function() use ($app) {
	output_json(R::exportAll(R::find('study')));
});

$app->get('/studies/:id', function ($id) use ($app) {
	$study = R::load("study", $id);
	if (!$study) { notFound(); }
	$k = R::exportAll($study);
	output_json($k[0]);
});

$app->put('/studies/:id', function ($id) use ($app) {
	$req = $app->request()->getBody();
	$study = R::load("study", $id);
	if (!$study) { notFound(); }
	$study->sharedAdvert = array_map(function ($advert) {
		return R::load('advert', $advert);
	}, $req['adverts']);
	R::store($study);
	output_json($study->export());
});

$app->post('/studies(/)', function () use ($app) {
	$study = R::dispense("study");
	$study->time = time();
	R::store($study);
	output_json($study->export());
});

