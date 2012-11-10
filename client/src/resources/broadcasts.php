<?php

$app->get('/broadcasts(/)', function() use ($app) {
	$userId = $app->request()->get('user');
	if ($userId) {
		$user = R::load('user', $userId);
		if (!$userId) {
			return notFound('User with that ID not found.');
		}
		unset($out);
		exec('python ../../../recommender/get_recommendation.py ' . $user->id, $out);
		$broadcastId = $out[0]; // Replace with 0 once get_recommender is fixed
		$broadcast = R::load('broadcast', $broadcastId);
		output_json($broadcast->export());
	} else {
		$broadcast = R::find('broadcast');
		output_json(array_map(function ($broadcast) {
			return array(
				'id' => $broadcast->id,
				'name' => $broadcast->name
			);
		}, array_values($broadcasts)));
	}
});

$app->get('/broadcasts/:id', function ($id) use ($app) {
	global $DB;
	$broadcast = R::load('broadcast', $id);
	if (!$broadcast) { return notFound('Broadcast with that ID not found.'); }
	$channel = R::load('channel', $broadcast->channel_id);

	$conn = new PDO($DB['project4']['string'], $DB['project4']['username'], $DB['project4']['password']);
	$q = $conn->prepare('SELECT * FROM project4_mos WHERE channel_ID = ? AND break_start_GMT > ? AND break_end_GMT < ?');
	$q->execute(array($channel->project4id, $broadcast->time, $broadcast->time + $broadcast->duration));
//	echo 'SELECT * FROM project4_mos WHERE channel_ID = ' . $channel->project4id . ' AND break_start_GMT > ' .  $broadcast->time . ' AND break_end_GMT < ' . ($broadcast->time + $broadcast->duration);
//	var_dump($q->fetchAll());

	output_json(array_merge($broadcast->export(), array(
		'timenow' => time(),
		'mos' => array_map(function ($mos) {
			return array(
				'start' => $mos['break_start_GMT'],
				'end' => $mos['break_end_GMT']
			);
		}, $q->fetchAll())
	)));
});

