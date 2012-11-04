<?php

$app->get('/broadcasts(/)', function() use ($app) {
		$broadcasts = R::find('broadcast', ' time > ? AND time < ? ', array(time(), time() + 3600)); // next hour
		output_json(array_map(function ($broadcast) {
			$channel = R::load('channel', $broadcast->channel_id);
			$programme = R::load('programme', $broadcast->programme_id);
			$serie = R::load('serie', $programme->serie_id);
			$brand = R::load('brand', $programme->brand_id);
//			var_dump($programme->sharedGenre);
			return array_merge($broadcast->export(), array(
				'channel' => $channel->export(),
				'programme' => array_merge($programme->export(), array(
					'brand' => $brand->id ? $brand->export() : null,
					'serie' => $serie->id ? $serie->export() : null,
					'genres' => array_map(function ($genre) {
						$category = R::load('genrecategory', $genre->genrecategory_id);
						return array(
							'id' => $genre->id,
							'code' => $genre->uid,
							'name' => $genre->name,
							'category' => array(
								'id' => $category->id,
								'name' => $category->name
							)
						);
					}, array_values($programme->sharedGenre))
				))
			));
		}, array_values($broadcasts)));
});

