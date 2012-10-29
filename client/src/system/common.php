<?php

require_once 'config.php';
require_once 'rb.php';
require_once 'json-prettifier.php';

/** FIXME: PUT THIS SOMEWHERE ELSE? **/
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if("OPTIONS" == $_SERVER['REQUEST_METHOD']) { exit(0); }

function set_db($conf_name) {
	global $DB;
	R::setup($DB[$conf_name]['string'], $DB[$conf_name]['username'], $DB[$conf_name]['password']);
}

function output_json($content) {
	header("Content-Type: application/json");
	echo json_format(json_encode($content));
	exit;
}

function get_params($res, $type, $param_list) {
	foreach ($param_list as $param => $default) {
		switch ($type) {
			case 'get':
				$contents = $res->get($param);
				break;
			case 'post':
				$contents = $res->post($param);
                                break;
			case 'put':
				$contents = $res->put($param);
                                break;
			default:
			case 'all':
				$contents = $res->params($param);
                                break;
		}

		$processed_params[$param] = is_null($contents) ? $default : $contents;
	}

	return $processed_params;
}

function fb_to_user($user_profile) {
	$field_map = array (
		'name' => 'name',
		'gender' => 'gender',
		'id' => 'facebookId',
		'birthday' => 'dob',
		'email' => 'email'
	);

	$user = array();
	array_walk($field_map, function($item, $key) use ($user_profile, &$user) {
		$user[$item] = (array_key_exists($key, $user_profile) ? $user_profile[$key] : null);
	}); 

	if($user['dob'] != null) {
		$user['dob'] = date('Y-m-d', strtotime($user['dob']));
	}	

	return $user;
}
