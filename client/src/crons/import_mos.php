<?php

// Note: this does not delete old items yet

require __DIR__ . '/../system/config.php';
require __DIR__ . '/../system/common.php';
require __DIR__ . '/genres.php';

set_db('your4');


$config = array(
	'apiKey' => 'ab455f64f7e04ccdb2750593c58e2ff6',
	'publisher' => 'pressassociation.com',
	'hours' => 7 * 24,
	'data' => array(
		'brand_summary',
		'series_summary',
		'extended_description',
		'broadcasts'
	)
);
$channels = array(
	'Channel 4' => array('cbdj', 518968274, 'c4.stream'),
	'4music' => array('cbdp', 518974999, '4music.stream'),
	'E4' => array('cbdn', 518974809, 'e4.stream'),
	'Film4' => array('cbdm', 518974601, 'film4.stream'),
	'More4' => array('cbdk', 518975484, 'm4.stream')
);

date_default_timezone_set('UTC');

echo "Importing genres...";

array_walk($genres, function ($genres, $categoryName) {

	$category = R::findOne('genrecategory', ' name = ? ', array($categoryName));
	if (!$category) {
		$category = R::dispense('genrecategory');
		$category->name = $categoryName;
		R::store($category);
	}

	array_walk($genres, function ($code, $name) use ($category) {
		$genre = R::findOne('genre', ' code = ? ', array($code));
		if (!$genre) {
			$genre = R::dispense('genre');
			$genre->code = $code;
			$genre->name = $name;
			$genre->genrecategory = $category;
			R::store($genre);
		}
	});
});

echo " done.\n";

array_walk($channels, function ($channelIds, $channelName) use ($config) {
	echo "Importing $channelName...\n";
	$percentComplete = 0;

	$url = 'http://atlas.metabroadcast.com/3.0/schedule.json?apiKey=' .
		$config['apiKey'] . '&publisher=' . $config['publisher'] .
		'&from=now&to=now.plus.' . $config['hours'] .
		'h&channel_id=' . $channelIds[0] . '&annotations=' .
		implode(',', $config['data']);

	echo "Fetching...";
	$result = json_decode(file_get_contents($url));
	echo " done.\n";

	$items = $result->schedule[0]->items;
	$l = count($items);

	$channel = R::findOne('channel', ' uid = ? ', array($channelIds[0]));

	if (!$channel) {
		$channel = R::dispense('channel');
		$channel->uid = $channelIds[0];
		$channel->project4id = $channelIds[1];
		$channel->url = $channelIds[2];
		$channel->name = $channelName;
		R::store($channel);
	}

	array_walk($items, function ($item, $i) use ($l, $channel, &$percentComplete) {
		$newPercent = floor(($i / $l) * 100);
		if ($newPercent > $percentComplete) {
			$percentComplete = $newPercent;
			echo "   $percentComplete%\n";
		}
	

		$itemBroadcast = $item->broadcasts[0];
		$broadcast = R::findOne('broadcast', ' uid = ? ', array($itemBroadcast->id));

		if (!$broadcast) {
			$broadcast = R::dispense('broadcast');
			$broadcast->uid = $itemBroadcast->id;
			$broadcast->time = strtotime($itemBroadcast->transmission_time);
			$broadcast->duration = $itemBroadcast->broadcast_duration; // or duration???
			$broadcast->repeat = isset($itemBroadcast->repeat) ? $itemBroadcast->repeat : false;
			$broadcast->channel = $channel;

			$programme = R::findOne('programme', ' uid = ? ', array($item->curie)); // curie = compact uri

			if (!$programme) {
				$programme = R::dispense('programme');
				$programme->uid = $item->curie;
				$programme->title = $item->title;
				$programme->description = isset($item->description) ? $item->description : '';
				$programme->episodeNumber = isset($item->episode_number) ? $item->episode_number : null;
				$programme->sharedGenres = array_filter(array_map(function ($uri) {
					if (strpos($uri, 'http://pressassociation.com/') !== 0) { return null; }
					return R::findOne('genre', ' code = ? ', array(substr($uri, -4)));
				}, $item->genres), function ($genre) { return $genre !== null; });

				if (isset($item->container)) {
					$brand = R::findOne('brand', ' uid = ? ', array($item->container->curie));
					if (!$brand) {
						$brand = R::dispense('brand');
						$brand->uid = $item->container->curie;
						$brand->title = $item->container->title;
						$brand->description = $item->container->description;
						unset($out);
						exec('python ../../../recommender/get_programme_vector.py "' . $item->container->title . '"', $out);
						$brand->vector = $out[0];
						R::store($brand);
					}
					$programme->brand = $brand;

					if (isset($item->series_summary)) {
						$serie = R::findOne('serie', ' uid = ? ', array($item->series_summary->curie));
						if (!$serie) {
							$serie = R::dispense('serie');
							$serie->uid = $item->series_summary->curie;
							$serie->seriesNumber = $item->series_summary->series_number;
							$serie->totalEpisodes = $item->series_summary->total_episodes;
							$serie->brand = $brand;
							R::store($serie);
						}
						$programme->serie = $serie;
					}
				} else {
					echo "  create new brand for " . $programme->title;
					// If programme does not have a brand, create one for it
					$brand = R::dispense('brand');
					$brand->uid = 'y4::b-' . rand(0, 99999999999);
					$brand->title = $programme->title;
					$brand->description = $programme->description;
					unset($out);
					exec('python ../../../recommender/get_programme_vector.py "' . $brand->title . '"', $out);
					$brand->vector = $out[0];
					R::store($brand);
					$programme->brand = $brand;
				}
				R::store($programme);
			}

			$broadcast->programme = $programme;
			R::store($broadcast);
		}

	});
	echo "$channelName done.\n";
});

echo("Import completed successfully.\n");
