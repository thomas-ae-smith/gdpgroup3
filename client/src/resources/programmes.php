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

	function list() {
		$programmes = R::find('project4_epg');
		return $programmes;
	}
}
