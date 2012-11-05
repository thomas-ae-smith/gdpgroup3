<?php

$app->get('/programmes(/)', function() use ($app) {
	$userId = $app->request()->get('user');
	if ($userId) {
		$user = R::load('users', $userId);
		if (!$userId) {
			return notFound('User with that ID not found.');
		}
		unset($out);
		exec('python ../../../recommender/get_recommendation.py -t 1351209900 ' . $user->id, $out);
		$programmeId = $out[1]; // Replace with 0 once get_recommender is fixed
		$programme = R::load('programmes', $programmeId);
		output_json(array(array(
			'id' => $programme->id,
			'channel' => $programme->channel,
			'start' => $programme->start,
			'nextAdBreakStart' => 0,
			'nextAdBreakEnds' => 0,
			'duration' => $programme->length * 60,
			'name' => $programme->name,
			'episode' => $programme->episode,
			'type' => $programme->type,
			'live' => $programme->live,
			'timenow' => time()
		)));
		
	} else {
		$programmes = R::find('programmes');
		output_json(array_map(function ($programme) {
			return array(
				'id' => $programme->id,
				'name' => $programme->name
			);
		}, array_values($programmes)));
		//output_json(R::exportAll($programmes));
	}
});

$app->get('/programmes/:id', function ($id) use ($app) {
	$programme = R::load('programmes', $id);
	if (!$programme->id) { return notFound('Programme with that ID not found.'); }
	output_json(array_merge(
		$programme->export(),
		array('timenow' => time())
	));
});
