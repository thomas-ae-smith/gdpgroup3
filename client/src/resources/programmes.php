<?php

$app->get('/programmes', function() use ($app) {
	$params = get_params($app->request(), 'get', 
		array(
			'date_start' => time() - 7*24*60*60,
			'date_end' => time()
		)
	);

	$programmes = R::find('programmes', 'start BETWEEN ? AND ?', array_values($params));
	output_json(R::exportAll($programmes));
});
