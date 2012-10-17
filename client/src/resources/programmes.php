<?php

$app->get('/programmes', function() {
	$programmes = R::find('epg');
	output_json(R::exportAll($programmes));
});
