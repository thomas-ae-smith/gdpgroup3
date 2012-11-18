<?php

function getSchedule($broadcast, $state = null) {
	$channel = R::load('channel', $broadcast->channel_id);
	$programme = $broadcast->programme;
	if (!is_null($state) && $programme->recordState !== $state) {
		return null;
	}
	return array(
		'id' => $broadcast->id,
		'programme_id' => $programme->id,
		'programme_uid' => $programme->uid,
		'channel_uid' => $channel->uid,
		'timestamp' => $broadcast->time,
		'duration' => $broadcast->programme->duration,
		'durationMS' => $broadcast->programme->duration * 1000,
		'programmeRecordState' => $programme->recordState,
		'programme_url' => programmeUrl($programme)
	);
}

$app->get('/schedule(/)', function() use ($app) {
	$state = isset($_GET['recordState']) ? $_GET['recordState'] : null;
	$interval = isset($_GET['interval']) ? intval($_GET['interval']) : 3600;
	$broadcasts = R::find('broadcast', ' time > ? AND time < ? ', array(time() - $interval, time() + $interval)); // next hour
	output_json(array_values(array_filter(array_map(function ($item) use ($state) {
		return getSchedule($item, $state);
	}, $broadcasts), function ($item) {
		return !is_null($item);
	})));
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
	$broadcast->programme->recordState = $req['programmeRecordState'];
	R::store($broadcast);
	output_json(getSchedule($broadcast));
});
