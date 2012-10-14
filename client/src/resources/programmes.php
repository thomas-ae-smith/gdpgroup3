<?php

/**
 * @uri /programmes
 */

class ProgrammeCollection extends Tonic\Resource {
	/**
	 * @method GET
	 * @provides application/json
	 * @json
	 */

	function programmes() {
		$programmes = R::find('project4_epg', 'start_TimeStamp > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))');
		return $programmes;
	}
}
