<?php

$app->get('/adverts(/:id)', function($id = null) use ($app) {
	if (is_null($id)) {
		$adverts = R::find('adverts');
		output_json(R::exportAll($adverts));
	} else {
		$adverts = R::find('adverts', 'id = ?', array($id));
		$r = R::exportAll($adverts);
		if (count($r) === 0) {
                        header('HTTP/1.0 404 Not Found');
                        output_json(array('error' => 'Could not find advert with that ID.'));
		} else {
			output_json($r[0]);
		}
	}
});
