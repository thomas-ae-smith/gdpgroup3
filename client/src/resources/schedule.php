<?php

function getSchedule($broadcast) {
	$channel = R::load('channel', $broadcast->channel_id);
	$programme = R::load('programme', $broadcast->programme_id);
	return array(
		'id' => $broadcast->id,
		'programme_uid' => $programme->uid,
		'channel_uid' => $channel->uid,
		'timestamp' => $broadcast->time,
		'duration' => $broadcast->duration,
		'record_state' => $broadcast->recordState
	);
}

$app->get('/schedule(/)', function() use ($app) {
	$interval = isset($_GET['interval']) ? intval($_GET['interval']) : 3600;
	$broadcasts = R::find('broadcast', ' time > ? AND time < ? AND recordState = 0 ', array(time() - $interval, time() + $interval)); // next hour
	output_json(array_map('getSchedule', array_values($broadcasts)));
});

$app->get('/schedule/:id(/)', function ($id) use ($app) {
	$broadcast = R::load('broadcast', $id);
	if (!$broadcast) { return notfound('Broadcast with that ID not found.'); }
	output_json(getSchedule($broadcast));
});

$app->put('/schedule/:id(/)', function ($id) use ($app) {
	$req = $app->request()->getBody();
	$broadcast = R::load('broadcast', $id);
	if (!$broadcast) { return notfound('Broadcast with that ID not found.'); }
	$broadcast->recordState = $req['record_state'];
	R::store($broadcast);
	output_json(getSchedule($broadcast));
});
