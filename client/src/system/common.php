<?php

function json() {
    $this->before(function ($request) {
        if ($request->contentType == "application/json") {
            $request->data = json_decode($request->data);
        }
    });
    $this->after(function ($response) {
        $response->contentType = "application/json";
        $response->body = json_encode($response->body);
    });
}
