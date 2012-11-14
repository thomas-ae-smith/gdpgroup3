<?php

$app->get('/time(/)', function() use ($app) {
	output_json(array(
		array('id' => 'now', 'time' => time())
	));
});
