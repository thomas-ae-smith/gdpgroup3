<?php



$app->get('/adverts(/)', function() use ($app) {
	$adverts = R::find('adverts');
	output_json(R::exportAll($adverts));
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
