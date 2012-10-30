<?php

$app->put('/users/:id(/)', function($id) use ($app) {
	
});
	
$app->get('/users/:id(/)', function($id) use ($app) {
	global $facebook;
	
	$params = get_params($app->request(), 'get',
		array (
			'type'	=> 'local'
		)
	);


	// Fetching user by fb id
	if ($params['type'] == 'fb') {
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

				$complete = true;
				foreach(array('name','gender','dob','email') as $field) {
					if (!isset($user_profile[$field])) {
						$complete = false;
						break;	
					}
				}

				if ($complete) {
					$bean = R::dispense('users');
					$bean->import($user_profile);
					R::store($bean);
				
					$user_profile['registered'] = true;
				}

				
				$_SESSION['user'] = $user_profile;
				output_json($_SESSION['user']);
			} catch(FacebookApiException $e) {
				output_json(array('error' => $e->getType()+': '+$e->getMessage()));			
			}
		} else {
			output_json(array('error' => 'No valid client side cookie'));
		}

	} else if ($params['type'] == 'local') {
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

