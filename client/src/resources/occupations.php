<?php

$app->get('/occupations(/)', function() use ($app) {
	$occupations = R::find('occupations');
	output_json(R::exportAll($occupations));
});
