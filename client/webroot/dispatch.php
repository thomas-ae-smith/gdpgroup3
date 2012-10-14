<?php

require_once '../src/system/bootstrap.php';

$config = array(
    'load' => array('../src/resources/*.php');
);

$app = new Tonic\Application($config);
$request = new Tonic\Request();

if ($request->contentType == 'application/json') {
    $request->data = json_decode($request->data);
}

try {
    $resource = $app->getResource($request);
    $response = $resource->exec();
} catch (Tonic\NotFoundException $e) {
    $response = new Tonic\Response(404, $e->getMessage());
} catch (Tonic\UnauthorizedException $e) {
    $response = new Tonic\Response(401, $e->getMessage());
    $response->wwwAuthenticate = 'Basic realm="My Realm"';
} catch (Tonic\Exception $e) {
    $response = new Tonic\Response($e->getCode(), $e->getMessage());
}

if ($response->contentType == 'application/json') {
    $response->body = json_encode($response->body);
}

$response->output();