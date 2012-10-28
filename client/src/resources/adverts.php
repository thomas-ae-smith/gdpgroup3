<?php

$app->get('/adverts(/)', function() use ($app) {
	$adverts = R::find('adverts');
	output_json(R::exportAll($adverts));
});

$app->get('/adverts/:id', function ($id) use ($app) {
	$advert = R::load('adverts', $id);
	if (!$advert->id) {
	        header('HTTP/1.0 404 Not Found');
                output_json(array('error' => 'Could not find advert with that ID.'));
        } else {
                output_json($advert->export());
        }

});

$app->put('/adverts/:id', function ($id) use ($app) {
	$req = $app->request()->getBody();
        $advert = R::load('adverts', $id);
        $advert->title = $req['title'];
	$advert->type = $req['type'];
//	$advert->url =
//	$advert->duration = 
	$advert->overlay = $req['overlay'];
        R::store($advert);
	output_json($advert->export());
});
