<?php

extension_loaded('ffmpeg') or die('Error in loading ffmpeg');

function generateImageThumbnail($path, $width = 120) {
        $img = imagecreatefrompng($path);
        $width = imagesx($img);
        $height = imagesy($img);
        $new_width = 120;
        $new_height = floor($height * ($new_width / $width));
        $tmp_img = imagecreatetruecolor($new_width, $new_height);
        imagecopyresized($tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
        $pathToImage = str_replace('http://www.your4.tv/img/stills/', '../../webroot/img/thumbs/stills/', $url);
        imagejpeg($tmp_img, $pathToImage);
        return str_replace('http://www.your4.tv/img/stills/', 'http://www.your4.tv/img/thumbs/stills/', $url);
}

function generateVideoThumbnail($path, $width = 120) {
        $length = floor(ffmpegStreamLen($path));
	return '';
}

function uploadVideo($path) {
	$url = '';
	return $url;
}

function videoDuration($path) {
	return floor(ffmpegStreamLen($path));
}

function findAvailableName($name) {
	$i = 0;
	while ($i === 0 || file_exists($filePath . '-' . $i . '.png')) {
		$i++;
	}
	return $filePath . '-' . $i . '.png';
}


$app->post('/files(/)', function() use ($app) {
	if (!isset($_FILES) || !isset($_FILES['file'])) {
		badRequest('File not supplied.');
		return;
	}

	$file = $_FILES['file'];
		
	if ($file['error']) {
		badRequest('Upload failed. Perhaps the file is too large?');
		return;
	}

	
	$fileName = substr($file['name'], 0, strrpos($file['name'], '.'));
	$fileTmp = $file['tmp_name'];

	$type = (getimagesize($fileTmp) ? "image" :
		( ? "video" : null));

	switch ($type) {
	case "image":
		$filePath = findAvailableName('../../webroot/img/stills/' . $fileName);
		$url = str_replace('../webroot', 'http://www.your4.tv', $filePath);
		imagepng(imagecreatefromstring(file_get_contents($fileTmp)), $filePath . '.png'); // convert to png
		$thumbnail = generateImageThumbnail($filePath);
		break;

	case "video":
		$thumbnail = generateVideoThumbnail($fileTmp);
		$url = uploadVideo($fileTmp);
		$duration = videoDuration($fileTmp);
		break;

	default:
		badRequest('File format invalid. Must be image or video.');
		return;

	}

	output_json(array(
		'url' => $url,
		'thumbnail' => $thumbnail,
		'duration' => $duration
	));

});
