<?php

require_once 'config.php';
require_once 'rb.php';

function set_db($conf_name) {
	global $DB;
	R::setup($DB[$conf_name]['string'], $DB[$conf_name]['username'], $DB[$conf_name]['password']);
}

function output_json($content) {
	header("Content-Type: application/json");
	echo json_encode($content);
	exit;
}
