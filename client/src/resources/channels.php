<?php

$app->get('/channels(/)', function() use ($app) {
	$channels = R::find('channel');
	output_json(array_map(function ($channel) {
		return array(
			'id' => $channel->id,
			'uid' => $channel->uid,
			'name' => $channel->name,
			'url' => $channel->url,
			'project4id' => $channel->project4id
		);
	}, array_values($channels)));
});
