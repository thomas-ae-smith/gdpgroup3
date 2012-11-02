<?php

function getIdType($id) {
	return strstr($id, 'fb-') ? 'fb' : 'local';
}

function processUser($app, $id) {
	global $facebook;

	$type = getIdType($id);
	$id = str_replace('fb-', '', $id);

	if ($type == 'fb') {
		$use_fields = array("occupation");
		$fb_id = $facebook->getUser();
		if ($fb_id && $fb_id == $id) {
			$user = R::findOne('users', 'facebookId = ?', array($fb_id));
			if (!$user) {
				$user = R::dispense('users');
				$user_profile = $facebook->api('/me','GET');
				$user->import(fb_to_user($user_profile));
				$user->lastFbRefresh = date('Y-m-d h:i:s');
			}
		} else {
			forbidden();
			exit;
		}
	} else {
		$use_fields = array("name","gender","dob","email","occupation","password");
		if (isset($_SESSION['user']['id'])) {
			if ($_SESSION['user']['id'] == $id) {
				$user = R::dispense('users',$id);
			} else {
				forbidden();
				exit;
			}
		} else {
			$user = R::dispense('users');
		}
	}

	$new_vals = array();
	
	$req = $app->request()->getBody();
	foreach ($use_fields as $field) {
		$field_content = $req[$field];
		if (isset($field_content)) {
			if ($field == "password") {
				$user->salt = substr(sha1(mt_rand()),0,22); //22 char salt for crypt
				$user->password = crypt($field_content,'$2a$10$'. $user->salt);
			} else {
				$user->setAttr($field, $field_content);
			}
			$new_vals[] = $field;
		} else if ($field != "password") {
			badRequest();
			exit;
		}
	}

	R::store($user);
	
	$_SESSION['user'] = $user->export();
	$_SESSION['user']['registered'] = true;

	output_json($_SESSION['user']);

}

$app->put('/users/:id(/)', function($id) use ($app) {
	processUser($app, $id);
});

$app->post('/users(/)', function() use ($app) {
	processUser($app, null);
}); 
	
$app->get('/users/:id(/)', function($id) use ($app) {
	global $facebook;
	
	$type = getIdType($id);
	$id = str_replace('fb-', '', $id);

	// Fetching user by fb id
	if ($type == 'fb') {
		$user_id = $facebook->getUser();
		
		//User is logged into fb
		if ($user_id && $user_id == $id) {

			// If the user is already in the DB load them into the session
			$user = R::findOne('users', 'facebookId = ?', array($user_id));
			if ($user) {
				if ($user->lastFbRefresh == null || strtotime($user->lastFbRefresh) < strtotime('-1 day')) {
        			$user_profile = $facebook->api('/me','GET');
					$user_profile = fb_to_user($user_profile);
					foreach (array('name','gender','dob','email') as $field) {
						if ($user_profile[$field] != null) {
							$user->setAttr($field, $user_profile[$field]);
						}
					}
					$user->lastFbRefresh = date('Y-m-d h:i:s');
					R::store($user);
				}

				$_SESSION['user'] = $user->export();
				$_SESSION['user']['registered'] = true;

				output_json($_SESSION['user']);
			}

			// If they aren't registered yet fetch their details and load into session
			try {
				$user_profile = $facebook->api('/me','GET');
				$user_profile = fb_to_user($user_profile);
				$user_profile['registered'] = false;

				$_SESSION['user'] = $user_profile;
				output_json($_SESSION['user']);
			} catch(FacebookApiException $e) {
				output_json(array('error' => $e->getType()+': '+$e->getMessage()));			
			}
		} else {
			output_json(array('error' => 'No valid client side cookie'));
		}

	} else if ($type == 'local') {
		output_json("local");
	}
});


$app->delete('/users/:id(/)', function($id) use ($app) {
	global $facebook;
	if (array_key_exists('user', $_SESSION)) {
		if ($_SESSION['user']['facebookId'] != null) {
			$user = R::load('users',$_SESSION['user']['id']);
			if ($_SESSION['user']['facebookId'] = $user->facebookId) {
				$token = $facebook->getAccessToken();
				$graph_url = "https://graph.facebook.com/me/permissions?method=delete&access_token=" . $token;
				$result = json_decode(file_get_contents($graph_url));
				if($result) {
					session_destroy();
				}
			} else {
				output_json("fail");
			}
		} else {
			session_destroy();
		}
	}

	output_json('success');
});

