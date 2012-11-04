<?php

$DB = array(
	'your4'	=> array(
		'host' => 'localhost',
		'port' => '3306',
		'db' => 'your4',
		'username' => 'your4',
		'password' => '4uzEse9&nuja6$5r'
	),
	'project4' => array(
		'host' => '77.244.130.51',
		'port' => '3307',
		'db' => 'inspirit_inqb8r',
		'username' => 'teamgdp',
		'password' => 'MountainDew2012'
	)
);

foreach ($DB as $db => $db_info) {
	$DB[$db]['string'] = "mysql:host=$db_info[host];port=$db_info[port];dbname=$db_info[db]";
}

$CONFIG['fb'] = array(
	'appId' => '424893924242103',
	'secret' => 'c648259db9304f6cc5abb49bedafa070',
	'fileUpload' => 'false'
);
