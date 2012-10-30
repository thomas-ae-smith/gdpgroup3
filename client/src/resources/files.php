<?php

extension_loaded('ffmpeg') or die('Error in loading ffmpeg');

function thumbnail($img) {
	$width = imagesx($img);
        $height = imagesy($img);
        $new_width = 120;
        $new_height = floor($height * ($new_width / $width));
        $tmp_img = imagecreatetruecolor($new_width, $new_height);
        imagecopyresized($tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
	return $tmp_img;
}

function generateImageThumbnail($thumbnail, $path) {
        $img = imagecreatefrompng($path);
        imagepng(thumbnail($img), $thumbnail);
        return str_replace('../../webroot', 'http://www.your4.tv', $thumbnail);
}

function generateVideoThumbnail($thumbnail, $video) {
	$count = $video->getFrameCount();
	$width = $video->getFrameWidth();
	$height = $video->getFrameHeight();
	$frame = $video->getFrame(floor($count / 10));
	imagepng(thumbnail($frame->toGDImage()), $thumbnail);
	return str_replace('../../webroot', 'http://www.your4.tv', $thumbnail);
}

function uploadVideo($path) {
//        $conn = ftp_connect($url); 
	$url = '';
	return $url;
}

function findAvailableName($filePath) {
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

	if (getimagesize($fileTmp)) {
		$filePath = findAvailableName('../../webroot/img/stills/' . $fileName);
		$url = str_replace('../../webroot', 'http://www.your4.tv', $filePath);
		$thumbnailPath = str_replace('/img/stills/', '/img/thumbs/stills', $filePath);
		imagepng(imagecreatefromstring(file_get_contents($fileTmp)), $filePath . '.png'); // convert to png
		$thumbnail = generateImageThumbnail($thumbnailPath, $filePath . '.png');
		output_json(array(
                        'type' => 'video',
                        'url' => $url,
                        'thumbnail' => $thumbnail,
                        'duration' => null
                ));
		return;
	}

	@$video = new ffmpeg_movie($fileTmp);
	if ($video) {
		$thumbnailPath = findAvailableName('../../webroot/img/thumbs/videos/' . $fileName);
		$thumbnail = generateVideoThumbnail($thumbnailPath, $video);
		$url = uploadVideo($fileTmp);
		output_json(array(
        	        'type' => 'video',
	                'url' => $url,
                	'thumbnail' => $thumbnail,
        	        'duration' => $video->getDuration()
	        ));
		return;
	}

	
	badRequest('File format invalid. Must be image or video.');

	output_json(array(
		'type' => $type,
		'url' => $url,
		'thumbnail' => $thumbnail,
		'duration' => $duration
	));

});
