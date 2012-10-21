<?php
ini_set('memory_limit', '1500M');

require_once 'config.php';
require_once 'rb.php';
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

