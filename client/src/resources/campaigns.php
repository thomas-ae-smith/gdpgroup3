<?php

$app->get('/campaigns/(:id)', function($id = null) use ($app) {

	if (!is_null($id)) {
		$r = R::find('campaigns', 'id = ?', array($id));
	} else {
		$r = R::find('campaigns');
	}

	$campaigns = array_map(function ($campaign) {

		$id = $campaign['id'];
		$campaign['gender'] = preg_split('@,@', $campaign['gender'], NULL, PREG_SPLIT_NO_EMPTY); // don't allow set [""]
		$campaign['schedule'] = preg_split('@,@', $campaign['schedule'], NULL, PREG_SPLIT_NO_EMPTY);
		$campaign['targets'] = array(
			'ageRanges' => R::getAll('SELECT minAge, maxAge FROM campaignAgeRanges WHERE campaign = ?', array($id)),
			'boundingBoxes' => R::getAll('SELECT minLat, minLong, maxLat, maxLong FROM campaignBoundingBoxes WHERE campaign = ?', array($id)),
			'genres' => R::getAll('SELECT genre FROM campaignGenres WHERE campaign = ?', array($id)),
			'occupations' => R::getAll('SELECT occupation FROM campaignOccupations WHERE campaign = ?', array($id)),
			'programmes' => R::getAll('SELECT programme FROM campaignProgrammes WHERE campaign = ?', array($id))
		);
		return $campaign;

	}, R::exportAll($r));

	
	if (!is_null($id)) {
		if (count($campaigns) === 0) {
			header('HTTP/1.0 404 Not Found');
			output_json(array('error' => 'Could not find campaign with that ID.'));
		} else {
			output_json($campaigns[0]);
		}
	} else {
		output_json($campaigns);
	}

});
