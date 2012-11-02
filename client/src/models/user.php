<?php

class Model_Users extends RedBean_SimpleModel {
	public function getType() {
		if ($this->facebookId != null) {
			return "fb";
		}

		return "normal";
	}

}
