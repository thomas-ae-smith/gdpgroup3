<?php

require __DIR__ . '/../system/config.php';
require __DIR__ . '/../system/common.php';

$pdo = new PDO($DB['project4']['string'], $DB['project4']['username'], $DB['project4']['password']);
$stmt = $pdo->prepare("SELECT REPLACE(channelName, ' ', '') AS channel, showName, description, episodeName, genre, type, duration_min, start_TimeStamp FROM project4_epg WHERE date > DATE_SUB(NOW(), INTERVAL 30 DAY) AND REPLACE(channelName, ' ', '') IN ('More4','Channel4','4Music','Film4','E4')");

$stmt->execute();
set_db('your4');

$beans = array();
while($row = $stmt->fetch()) {
	$bean = R::dispense('epg');
	$bean->channel = $row['channel'];
	$bean->show = $row['showName'];
	$bean->description = $row['description'];
	$bean->episode = $row['episodeName'];
	$bean->genre = $row['genre'];
	$bean->type = $row['type'];
	$bean->duration = $row['duration_min'];
	$bean->start = $row['start_TimeStamp'];
	$beans[] = $bean;
}

R::storeAll($beans);

