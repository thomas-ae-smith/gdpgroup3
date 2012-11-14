<?php

$app->get("/postcode/:postcode", function ($postcode) {
    output_json(postcode_to_coord($postcode));
});

