<?php

$app->post('/files(/)', function() use ($app) {
	if (isset($_FILES) && isset($_FILES['file'])) {
		$file = $_FILES['file'];
		
		if ($file['error']) {
			badRequest('Upload failed. Perhaps the file is too large?');
		} else {

			$fileName = substr($file['name'], 0, strrpos($file['name'], '.'));
			$filePath = '../../webroot/img/stills/' . $fileName;
			$fileUrl = 'http://www.your4.tv/img/stills/' . $fileName;
			$fileTmp = $file['tmp_name'];
			
			if (getimagesize($fileTmp)) {
				$i = 0;
				$origFilePath = $filePath;

				while ($i === 0 || file_exists($filePath . '.png')) {
					$i++;
					$filePath = $origFilePath . '-' . $i;
				}
				$fileUrl .= '-' . $i;

				imagepng(imagecreatefromstring(file_get_contents($fileTmp)), $filePath . '.png');

				output_json(array('url' => $fileUrl . '.png'));

			} else {
				badRequest('File format invalid. Must be image or video.');
			}
		}
	} else {
		badRequest('File not supplied.');
	}
	
});
