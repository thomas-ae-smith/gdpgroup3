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
	$type = $req['type'];
	switch ($type) {
	case 'still':
		$url = $req['url']; // TODO: check it's in our location, exists etc
		$path = str_replace('http://www.your4.tv/img/', '../../webroot/img/', $url);
		$img = imagecreatefrompng($path);
		$width = imagesx($img);
		$height = imagesy($img);
            	$new_width = 120;
            	$new_height = floor($height * ($new_width / $width));
            	$tmp_img = imagecreatetruecolor($new_width, $new_height);
            	imagecopyresized($tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
                $pathToImage = str_replace('http://www.your4.tv/img/stills/', '../../webroot/img/thumbs/stills/', $url);
            	imagejpeg($tmp_img, $pathToImage);
		$thumbnail = str_replace('http://www.your4.tv/img/stills/', 'http://www.your4.tv/img/thumbs/stills/', $url);
		//$duration = $req['duration'];
		break;
	case 'video':
		/* Do stuff with wowza */
		$url = "";
		$thumbnail = "";
		$duration = "";
		break;
	default:
		invalid('Invalid type.');
	}
	$advert->type = $type;
	$advert->title = $req['title'];
	$advert->overlay = $req['overlay'];
	$advert->url = $url;
	$advert->thumbnail = $thumbnail;
	//$advert->duration = $duration;
	R::store($advert);
	output_json($advert->export());
}

$app->post('/adverts(/)', function () use ($app) {
	$req = $app->request()->getBody();
	$advert = R::dispense('adverts');
	setAdvert($advert, $req);
});
