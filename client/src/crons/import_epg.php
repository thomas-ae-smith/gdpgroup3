<?php

require __DIR__ . '/../system/config.php';
require __DIR__ . '/../system/common.php';

set_db('your4');

$options = getopt('t:');
$days = 1;

if (defined($options['t'])) {
	$days = $options['t'];
}

$pdo = new PDO($DB['project4']['string'], $DB['project4']['username'], $DB['project4']['password']);
$stmt = $pdo->prepare("SELECT channelID, showName, description, episodeName, genre, type, duration_min, start_TimeStamp FROM project4_epg WHERE date > DATE_SUB(NOW(), INTERVAL ? DAY) AND REPLACE(channelName, ' ', '') IN ('More4','Channel4','4Music','Film4','E4')");

$stmt->execute(array($days));

$beans = array();
$length = $stmt->rowCount();
while($row = $stmt->fetch()) {
	$i++;
	print "$i/$length\n";
	$bean = R::dispense('programmes');
	$bean->channel = $row['channelID'];
	$bean->name = $row['showName'];
	$bean->description = $row['description'];
	$bean->episode = $row['episodeName'];
	$bean->genre = $row['genre'];
	$bean->type = $row['type'];
	$bean->length = $row['duration_min'];
	$bean->start = $row['start_TimeStamp'];

	unset($out);
	exec("python ../../../recommender/get_programme_vector.py \"$row[showName]\"", $out);
	$bean->vector = $out[0];

	$beans[] = $bean;
}

R::storeAll($beans);

R::trashAll(R::find('programmes', ' start < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))'));


