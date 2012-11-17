<?php

// Note: this does not delete old items yet

require __DIR__ . '/../system/config.php';
require __DIR__ . '/../system/common.php';
require __DIR__ . '/genres.php';

set_db('your4');

$broadcasts = R::find('broadcast');

//$broadcasts = $broadcasts;

array_walk($broadcasts, function ($broadcast) {
	global $DB;
	$programme = $broadcast->programme;
	$channel = $broadcast->channel;
	
	$conn = new PDO($DB['project4']['string'], $DB['project4']['username'], $DB['project4']['password']);
	$q = $conn->prepare('SELECT * FROM project4_mos WHERE channel_ID = ? AND break_start_GMT > ? AND break_end_GMT < ?');
	$q->execute(array($channel->project4id, $broadcast->time, $broadcast->time + $broadcast->programme->duration));
	$rows = $q->fetchAll();

	echo count($rows) . " ";

	$programme->ownAdbreak = array_map(function ($row) use ($broadcast) {
		$break = R::dispense('adbreak');
		$break->startTime = $row['break_start_GMT'] - $broadcast->time;
		$break->endTime = $row['break_end_GMT'] - $broadcast->time;
		R::store($break);
		return $break;
	}, $rows);

	R::store($programme);
});
