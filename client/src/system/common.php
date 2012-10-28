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
	$user = array();
	$user['name'] = $user_profile['name'];
	$user['gender'] = $user_profile['gender'];
	$user['facebookId'] = $user_profile['id'];
	$user['dob'] = $user_profile['birthday'];
	$user['email'] = $user_profile['email'];
	return $user;
}
