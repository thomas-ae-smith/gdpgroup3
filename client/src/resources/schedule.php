<?php

$app->get('/schedule(/)', function() use ($app) {
		$interval = isset($_GET['interval']) ? intval($_GET['interval']) : 3600;
		$broadcasts = R::find('broadcast', ' time > ? AND time < ? ', array(time() - $interval, time() + $interval)); // next hour
		output_json(array_map(function ($broadcast) {
			$channel = R::load('channel', $broadcast->channel_id);
			$programme = R::load('programme', $broadcast->programme_id);
			return array(
				'programme_uid' => $programme->uid,
				'channel_uid' => $channel->uid,
				'timestamp' => $broadcast->time,
				'duration' => $broadcast->duration
			);
		}, array_values($broadcasts)));
});

