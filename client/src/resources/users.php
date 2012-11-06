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
			$user = R::findOne('user', 'facebookId = ?', array($fb_id));
			if (!$user) {
				$user = R::dispense('user');
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
				$user = R::dispense('user',$id);
			} else {
				forbidden();
				exit;
			}
		} else {
			$user = R::dispense('user');
		}
	}

	$req = $app->request()->getBody();
	foreach ($use_fields as $field) {
		$field_content = $req[$field];
		if (isset($field_content)) {
			if ($field == "password") {
				$salt = substr(sha1(mt_rand()),0,22); //22 char salt for crypt
				$user->password = crypt($field_content,'$2a$10$'. $salt);
			} else {
				$user->setAttr($field, $field_content);
			}
		} else if ($field != "password") {
			badRequest();
			exit;
		}
	}

	if ($type == 'local' && $app->request()->isPost()) {
		$user->vector = get_user_vector($user->dob, $user->gender);
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

	if (isset($_SESSION['user']['id']) && ($id == 'me' || $_SESSION['user']['id'] == $id || ($type == 'fb' && $_SESSION['user']['facebookId'] == $id))) {
		if ($id == 'me') {
			$id = $_SESSION['user']['id'];
		}

		// Force processing via facebook if facebook user
		if ($type == 'local' && isset($_SESSION['user']['facebookId'])) {
			$type = 'fb';
			$id = $_SESSION['user']['facebookId'];
		}

		$query_str = $type == 'fb' ? 'facebookId = ?' : 'id = ?';
		if (isset($_SESSION['user']['registered'])) {
			$db_user = R::findOne('user', $query_str, array($id));
			if (is_null($db_user)) {
				logout();
			}
		}
	} else if (isset($_SESSION['user']['id']) || $type != 'fb') {
		badRequest();
	}

	// Fetching user by fb id
	if ($type == 'fb') {
		$user_id = $facebook->getUser();
		
		//User is logged into fb
		if ($user_id && $user_id == $id) {

			// If the user is already in the DB load them into the session
			$user = R::findOne('user', 'facebookId = ?', array($user_id));
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

	} else if ($type == 'local' && isset($_SESSION['user']['registered'])) {
		$_SESSION['user'] = $db_user->export();
		output_json($_SESSION['user']);
	} else {
		notFound();
	}
});

$app->get('/users/', function() use ($app) {
	$email = $app->request()->get('email');
	$pass = $app->request()->get('password');
	if (!isset($email) || !isset($pass)) {
		badRequest();
	}

	$user = R::findOne('user','email = ?',array($email));
	if ($user == null) {
		forbidden();
	}

	if($user->password == crypt($pass, substr($user->password, 0, 29))) {
		$_SESSION['user'] = $user->export();
		$_SESSION['user']['registered'] = true;
		output_json($_SESSION['user']);
	} else {
		forbidden();
	}
});

function logout() {
	global $facebook;
	$token = $facebook->getAccessToken();
	if ($token) {
		$graph_url = "https://graph.facebook.com/me/permissions?method=delete&access_token=" . $token;
		$result = @file_get_contents($graph_url);
	}

	session_destroy();
}


$app->delete('/users/:id(/)', function($id) use ($app) {
	logout();
});

