<?php

$app->get('/impressions(/)', function () use ($app) {
	$impressions = R::find('advertimpression');
	output_json(array_map(function ($impression) {
		$clicks = R::find('advertclick', ' advertimpression_id = ? ', array($impression->id));
		return array_merge($impression->export(), array(
			'clicks' => R::exportAll($clicks)
		));
			
	}, array_values($impressions)));
});


$app->get('/impressions/:id(/)', function ($id) use ($app) {
	$impressions = R::find('advertimpression', ' advert_id = ? ', array($id));
	output_json(array_map(function ($impression) {
		$clicks = R::find('advertclick', ' advertimpression_id = ? ', array($impression->id));
		return array_merge($impression->export(), array(
			'clicks' => R::exportAll($clicks)
		));

	}, array_values($impressions)));
});


$app->get('/impressions/populate', function() use ($app) {
	$adverts = array_values(R::findAll('adverts'));
	$users = array_values(R::findAll('users'));

	for ($i = 0; $i < 100; $i++) {
		$impression = R::dispense('advertimpression');
		$impression->advert = $adverts[rand(0, count($adverts) - 1)];
		$impression->user = $users[rand(0, count($users) - 1)];
		$impression->timestamp = time() - rand(0, 24 * 60 * 60);
		if (rand(0, 4) >= 3) {
			$impression->skiptime = rand(0, 120);
		}
		if (rand(0, 4) >= 3) {
			$click = R::dispense('advertclick');
			$click->percentX = rand(0, 100);
			$click->percentY = rand(0, 100);
			$click->time = rand(0, 120);
			$click->advertimpression = $impression;
			R::store($click);
		}
		R::store($impression);
	}
});
