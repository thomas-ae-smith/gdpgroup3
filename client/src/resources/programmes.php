<?php


use Tonic\Resource,
    Tonic\Response;
	
/**
 * @uri /programmes
 */

class ProgrammeCollection extends Your4Resource {
	/**
	 * @method GET
	 * @provides application/json
	 * @json
	 */

	function programmes() {
		$programmes = R::find('epg', 'startTime > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))');
		return new Response(Response::OK, $programmes);
	}
}
