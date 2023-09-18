<?php
	$dir    = scandir("savedMaps");
	$output = array();
	
	foreach( $dir as $file ) {
		if ( strpos($file, ".geojson") ) {
			array_push($output, $file);
		}
	}
	
	header("Content-type: application/json");
	print json_encode($output);
?>