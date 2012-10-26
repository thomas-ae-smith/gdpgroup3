<?php

$app->get('/users/:id', function($id) use ($app) {
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
			$user = R::find('users', 'facebookId = ?', array($user_id));
			if ($user) {
					
				if ($user->lastFbRefresh == null || strtotime($user->lastFbRefresh) < strtotime('-1 day')) {
        				$user_profile = $facebook->api('/me','GET');
					$user->import(fb_to_user($user_profile), 'name,gender,dob,email');
					$user->store();
                                }

				if (!defined($_SESSION['user'])) {
					$_SESSION['user'] = $user;
				}

				output_json($_SESSION['user']);
			}

			// If they aren't registered yet fetch their details and load into session
			try {
				$user_profile = $facebook->api('/me','GET');
				$_SESSION['user'] = fb_to_user($user_profile);
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


$app->get('/users', function() use ($app) {

});

