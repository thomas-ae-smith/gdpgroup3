<?php

$targetTables = array(
	'ageRanges' => array('table' => 'campaignAgeRanges', 'fields' => array('id', 'minAge', 'maxAge')),
	'boundingBoxes' => array('table' => 'campaignBoundingBoxes', 'fields' => array('id', 'minLat', 'minLong', 'maxLat', 'maxLong')),
	'genres' => array('table' => 'campaignGenres', 'fields' => array('id', 'genre')),
	'occupations' => array('table' => 'campaignOccupations', 'fields' => array('id', 'occupation')),
	'programmes' => array('table' => 'campaignProgrammes', 'fields' => array('id', 'programme'))
);

function getTargets($id, $type) {
	global $targetTables;
	if (!array_key_exists($type, $targetTables)) { return false; }

	$beans = R::find($targetTables[$type]['table'], ' campaign = ? ', array($id));

	return array_map(function ($bean) use ($targetTables, $type) {
		$r = array();
		array_walk($targetTables[$type]['fields'], function ($field) use ($bean, &$r) {
			$r[$field] = $bean->{$field};
		});
		return $r;
	}, array_values($beans));
}
function getAllTargets($id) {
	global $targetTables;
	$r = array();
	array_walk(array_keys($targetTables), function ($type) use ($id, &$r) {
		$r[$type] = getTargets($id, $type);
	});
	return $r;
}
function getAdverts($id) {
	$beans = R::find('campaignAdverts', ' campaign = ? ', array($id));
	return array_map(function ($bean) { return $bean->id; }, array_values($beans));
}
function campaignExists($id) {
	$bean = R::load('campaigns', $id);
	return $bean->id > 0;
}

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
		$campaign['adverts'] = getAdverts($id);
		$campaign['targets'] = getAllTargets($id);
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

function notFound($msg = 'Not found') {
	header('HTTP/1.0 404 Not Found');
	output_json(array('error' => $msg));
}

$app->get('/campaigns/:id/adverts(/)', function ($id) use ($app) {
	if (campaignExists($id)) {
		output_json(getAdverts($id));
	} else {
		notFound('Campaign not found.');
	}
});

$app->get('/campaigns/:id/targets(/)', function ($id) use ($app) {
	if (campaignExists($id)) {
		output_json(getAllTargets($id));
	} else {
		notFound('Campaign not found.');
	}
});

$app->get('/campaigns/:id/targets/:type(/)', function ($id, $type) use ($app, $targetTables) {
	if (campaignExists($id)) {
		$r = getTargets($id, $type);
	
		if ($r === false) {
			notFound('No such type.');
		} else {
			output_json($r);
		}
	} else {
		notFound('Campaign not found.');
	}
});
