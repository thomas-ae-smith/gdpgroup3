<?php

$app->get('/genres(/)', function() use ($app) {
	$genres = R::find('genres');
	output_json(R::exportAll($genres));
});
