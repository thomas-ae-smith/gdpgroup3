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

function notFound($msg = 'Not found') {
    header('HTTP/1.0 404 Not Found', true, 404);
    output_json(array('error' => $msg));
	exit;
}

function invalid($msg = 'Invalid method') {
    header('HTTP/1.1 405 Method Not Allowed', true, 405);
	output_json(array('error' => $msg));
	exit;
}

function badRequest($msg = 'Bad request') {
	header('HTTP/1.0 400 Bad Request', true, 400);
	output_json(array('error' => $msg));
	exit;
}

function noContent() {
	header('HTTP/1.1 204 No Content', true, 204);
	exit;
}

function forbidden($msg = "Access denied.") {
	header('HTTP/1.1 403 Forbidden', true, 403);
	output_json(array('error' => $msg));
	exit;
}

function internalError($msg = 'Internal Server Error.') {
	header('HTTP/1.0 500 Internal Server Error', true, 500);
	output_json(array('error' => $msg));
	exit;
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

	$dob_parts = explode("/", $user['dob']);

	if ($user['dob'] != null) {
		$user['dob'] = date('Y-m-d', strtotime($user['dob']));
	}

	$user['occupation_id'] = null;

	$user['vector'] = get_user_vector($user['dob'], $user['gender']);
	return $user;
}

function get_user_vector($dob, $gender) {
	$gender = substr($gender, 0, 1);
	$dob_parts = explode('-', $dob);
	$age = (date("md", date("U", mktime(0, 0, 0, $dob_parts[1], $dob_parts[2], $dob_parts[0]))) > date("md") ? ((date("Y")-$dob_parts[0])-1):(date("Y")-$dob_parts[0]));
	$age = min(100, max(0, $age));
	exec("python ../../../recommender/get_user_vector.py $age $gender", $out);
	return $out[0];
}

function ifsetor(&$variable, $default = null) {
    if (isset($variable)) {
        $tmp = $variable;
    } else {
        $tmp = $default;
    }
    return $tmp;
}

function postcode_to_coord($postcode) {
	$url = "http://data.ordnancesurvey.co.uk/doc/postcodeunit/" . $postcode . '.json';

	$headers = get_headers($url);

	if (substr($headers[0], 9, 3) == '200') {
		$postcode_data = @file_get_contents($url);
	} else {
		throw new Exception('Invalid postcode');
	}

	if ($postcode_data === false) {
		throw new Exception('Error retrieving postcode coords');
	}

	$postcode_data = json_decode($postcode_data, true);

	$postcode_unit_uri = 'http://data.ordnancesurvey.co.uk/id/postcodeunit/' . $postcode;
	$postcode_pos_uri = 'http://www.w3.org/2003/01/geo/wgs84_pos#';
	
	$ret = array(
		'lat' => $postcode_data[$postcode_unit_uri][$postcode_pos_uri . 'lat'][0]['value'],
		'long' => $postcode_data[$postcode_unit_uri][$postcode_pos_uri . 'long'][0]['value']
	);

	return $ret;

}

