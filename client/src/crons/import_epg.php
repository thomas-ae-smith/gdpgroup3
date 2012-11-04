<?php

// Note: this does not delete old items yet

require __DIR__ . '/../src/system/config.php';
require __DIR__ . '/../src/system/common.php';
require 'genres.php';

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
	'Channel 4' => 'cbdj',
	'4music' => 'cbdp',
	'E4' => 'cbdn',
	'Film4' => 'cbdm',
	'More4' => 'cbdk'
);

date_default_timezone_set('UTC');

array_walk($genres, function ($genres, $categoryName) {

	$category = R::load('genrecategory', ' name = ? ', array($categoryName));
	if (!$category->id) {
		$category = R::dispense('genrecategory');
		$category->name = $categoryName;
		R::store($category);
	}

	array_walk($genres, function ($code, $name) use ($category) {
		$genre = R::load('genre', ' code = ? ', array($code));
		if (!$genre->id) {
			$genre->code = $code;
			$genre->name = $name;
			$genre->sharedGenreCategory = $category;
			R::store($genre);
		}
	});
});

array_walk($channels, function ($channelId, $channelName) use ($config) {
	$url = 'http://atlas.metabroadcast.com/3.0/schedule.json?apiKey=' .
		$config['apiKey'] . '&publisher=' . $config['publisher'] .
		'&from=now&to=now.plus.' . $config['hours'] .
		'h&channel_id=' . $channelId . '&annotations=' .
		implode(',', $config['data']);

	$result = json_decode(file_get_contents($url));

	$items = $result->schedule[0]->items;

	$channel = R::findOne('channel', ' uid = ? ', array($channelId));

	if (!$channel->id) {
		$channel = R::dispense('channel');
		$channel->uid = $channelId;
		$channel->name = $channelName;
		R::store($channel);
	}

	array_walk($items, function ($item) {
		$itemBroadcast = $item->broadcasts[0];
		$broadcast = R::findOne('broadcast', ' uid = ? ', array($itemBroadcast->id));

		if (!$broadcast->id) {
			$broadcast = R::dispense('broadcast');
			$broadcast->uid = $itemBroadcast->id;
			$broadcast->time = strtotime($itemBroadcast->transmission_time);
			$broadcast->duration = $itemBroadcast->broadcast_duration; // or duration???
			$broadcast->repeat = $itemBroadcast->repeat;
			$broadcast->sharedChannel = $channel;

			$programme = R::findOne('programme', ' uid = ? ', array($item->curie)); // curie = compact uri

			if (!$programme->id) {
				$programme = R::dispense('programme');
				$programme->uid = $item->curie;
				$programme->title = $item->title;
				$programme->description = $item->description;
				$programme->episodeNumber = $item->episode_number;
				$programme->sharedGenres = array_filter(array_map(function ($uri) {
					if (strpos($uri, 'http://pressassociation.com/') !== 0) { return null; }
					return R::findOne('genre', ' code = ? ', array(substr($uri, -4)));
				}, $item->genres), function ($genre) { return $genre !== null; });

				if (isset($item->container)) {
					$brand = R::findOne('brand', ' uid = ? ', array($item->container->curie));
					if (!$brand->id) {
						$brand = R::dispense('brand');
						$brand->uid = $item->container->curie;
						$brand->title = $item->container->title;
						$brand->descriptions = $item->container->description;
						R::store($brand);
					}
					$programme->sharedBrand = $brand;

					if (isset($item->series_summary)) {
						$serie = R::findOne('serie', ' uid = ? ', array($item->series_summary->curie));
						if (!$serie->id) {
							$serie = R::dispense('serie');
							$serie->uid = $item->series_summary->curie;
							$serie->seriesNumber = $item->series_summary->series_number;
							$serie->totalEpisodes = $item->series_summary->total_episodes;
							$serie->sharedBrand = $brand;
							R::store($serie);
						}
						$programme->sharedSerie = $serie;
					}
				}
				R::store($programme);
			}

			$broadcast->sharedProgramme = $programme;
			R::store($broadcast);
		}

	});

});

echo("Done.\n");
