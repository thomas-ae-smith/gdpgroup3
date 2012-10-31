<?php

$targetTables = array(
	'ageRanges' => array('name' => 'ownAgerange', 'fields' => array('minAge', 'maxAge')),
	'boundingBoxes' => array('name' => 'ownBoundingbox', 'fields' => array('minLat', 'minLong', 'maxLat', 'maxLong')),
	'genres' => array('name' => 'sharedGenres', 'fields' => array('genre')),
	'occupations' => array('name' => 'sharedOccupations', 'fields' => array('occupation')),
	'programmes' => array('name' => 'sharedProgrammes', 'fields' => array('programme'))
);

function getTargets(&$campaign, $type) {
	global $targetTables;
	if (!array_key_exists($type, $targetTables)) { return false; }

	$items = ifsetor($campaign[$targetTables[$type]['name']], array());

	unset($campaign[$targetTables[$type]['name']]);

	return array_map(function ($item) use ($targetTables, $type) {
		$r = array();
		array_walk($targetTables[$type]['fields'], function ($field) use ($item, &$r) {
			$r[$field] = $item[$field];
		});
		return $r;
	}, array_values($items));
}
function getAllTargets(&$campaign) {
	global $targetTables;
	$r = array();
	array_walk(array_keys($targetTables), function ($type) use (&$campaign, &$r) {
		$r[$type] = getTargets($campaign, $type);
	});
	return $r;
}
function campaignExists($id) {
	$bean = R::load('campaigns', $id);
	return $bean->id > 0;
}

$app->get('/campaigns(/(:id))', function($id = null) use ($app) {
	if (!is_null($id)) {
		$r = R::find('campaigns', 'id = ?', array($id));
	} else {
		$r = R::find('campaigns');
	}

	$campaigns = array_map(function ($campaign) {
		$id = $campaign['id'];
		$campaign['gender'] = preg_split('@,@', $campaign['gender'], NULL, PREG_SPLIT_NO_EMPTY); // don't allow set [""]
		$campaign['schedule'] = preg_split('@,@', $campaign['schedule'], NULL, PREG_SPLIT_NO_EMPTY);
		$campaign['adverts'] = ifsetor($campaign['sharedAdverts'], array());
		unset($campaign['sharedAdverts']);
		$campaign['targets'] = getAllTargets($campaign);
		return $campaign;
	}, R::exportAll($r));

	
	if (!is_null($id)) {
		if (count($campaigns) === 0) { return notFound('Could not find campaign with that ID.'); }
		output_json($campaigns[0]);
	} else {
		output_json($campaigns);
	}
});

//$app->get('/campaigns/:id/adverts(/)', function ($id) use ($app) {
//	if (campaignExists($id)) { return notFound('Campaign not found.'); }
//	output_json(getAdverts($id));
//});

//$app->get('/campaigns/:id/targets(/)', function ($id) use ($app) {
//	if (campaignExists($id)) { return notFound('Campaign not found.'); }
//	output_json(getAllTargets($id));
//});

//$app->get('/campaigns/:id/targets/:type(/)', function ($id, $type) use ($app, $targetTables) {
//	if (!campaignExists($id)) { return notFound('Campaign not found.'); }
//	$r = getTargets($id, $type);	
//	if ($r === false) { return notFound('No such type.'); }
//	output_json($r);
//});

$app->put('/campaigns/:id', function ($id) use ($app) {
        $req = $app->request()->getBody();
        $campaign = R::load('campaigns', $id);
        setCampaign($campaign, $req);
});

$app->post('/campaigns(/)', function () {
        $req = $app->request()->getBody();
        $campaign = R::dispense('campaigns');
        setCampaign($campaign, $req);
});

function setCampaign($campaign, $req) {
	$campaign->title = $req['title'];
	$campaign->startDate = $req['startDate'];
	$campaign->endDate = $req['endDate'];
	
	//$campaign->schedule = $req['schedule'];
	//$campaign->gender = $req['gender'];

        $campaignId = R::store($campaign);

	$campaign->sharedAdverts = array_map(function ($id) {
		return R::load('adverts', $id);
	}, ifsetor($req['adverts'], array()));

	$campaign->ownAgerange = array_map(function ($r) use ($campaignId) {
		$minAge = $r['minAge'];
		$maxAge = $r['maxAge'];
		$bean = R::findOne('agerange', ' minAge = ? AND maxAge = ? AND campaigns_id = ? ', array($minAge, $maxAge, $campaignId));
		if (!$bean) {
			$bean = R::dispense('agerange');
			$bean->minAge = $minAge;
			$bean->maxAge = $maxAge;
		}
		return $bean;
	}, ifsetor($req['targets']['ageRanges'], array()));

	$campaign->ownBoundingbox = array_map(function ($r) use ($campaignId) {
		$minLat = $r['minLat'];
                $maxLat = $r['maxLat'];
                $minLong = $r['minLong'];
                $maxLong = $r['maxLong'];
		$bean = R::findOne('boundingbox', ' minLat = ?, maxLat = ?, minLong = ?, maxLong = ? ', array($minLat, $maxLat, $minLong, $maxLong));
		if (!$bean) {
      	   		$bean = R::dispense('boundingbox');
                	$bean->minLat = $r['minLat'];
	                $bean->maxLat = $r['maxLat'];
	                $bean->minLong = $r['minLong'];
	                $bean->maxLong = $r['maxLong'];
		}
                return $bean;
        }, ifsetor($req['targets']['boundingBoxes'], array()));

	$campaign->ownTime = array_map(function ($r) {
                $dayOfWeek = $r['dayOfWeek'];
		$startTime = $r['startTime'];
                $endTime = $r['endTime'];
		$bean = R::findOne('time', ' dayOfWeek = ?, startTime = ?, endTime = ? ', array($dayOfWeek, $startTime, $endTime));
		if (!$bean) {
	                $bean = R::dispense('time');
	                $bean->dayOfWeek = $r['dayOfWeek'];
			$bean->startTime = $r['startTime'];
	                $bean->endTime = $r['endTime'];
		}
                return $bean;
        }, ifsetor($req['targets']['time'], array()));

	$campaign->sharedGenres = array_map(function ($id) {
		return R::load('genres', $id);
	}, ifsetor($req['targets']['genres'], array()));
	
	$campaign->sharedOccupations = array_map(function ($id) {
		return R::load('occupations');
	}, ifsetor($req['targets']['occupations'], array()));

	$campaign->sharedProgrammes = array_map(function ($id) {
		return R::load('programmes', $id);
	}, ifsetor($req['targets']['programmes'], array()));

	$campaignId = R::store($campaign);
	
	//if (isset($req['adverts'])) {
	//	array_walk($req['adverts'], function ($advert) {
	//		if (!$advert['id']) {
	//			$campaignAdvert = R::dispense('campaignAdverts');
	//			$campaignAdvert->campaign = $campaignAdvert;
	//			$campaignAdvert->advert = $advert['advert'];
	//		}
	//	});
	//}
        output_json($campaign->export());

}
