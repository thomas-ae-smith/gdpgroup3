<?php
ini_set('memory_limit', '1500M');
session_cache_limiter(false);
session_start();

require_once 'config.php';
require_once 'rb.php';

require_once 'facebook/facebook.php';
$facebook = new Facebook($CONFIG['fb']);

require_once 'common.php';
set_db('your4');

require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();
$app = new \Slim\Slim();

$app->add(new \Slim\Middleware\ContentTypes());

foreach (glob(__DIR__ . "/../resources/*.php") as $filename) {
    include $filename;
}

$app->run();

