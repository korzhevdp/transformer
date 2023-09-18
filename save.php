<?php
//print $_POST['markers']."\n\n";
//print $_POST['polylines']."\n\n";
//print $_POST['polygons']."\n\n";
//print $_POST['circles']."\n\n";
$output    = array();
$markers   = (isset($_POST['markers']))   ? json_decode($_POST['markers'])   : array();
$polylines = (isset($_POST['polylines'])) ? json_decode($_POST['polylines']) : array();
$polygons  = (isset($_POST['polygons']))  ? json_decode($_POST['polygons'])  : array();
$circles   = (isset($_POST['circles']))   ? json_decode($_POST['circles'])   : array();
$rulers    = (isset($_POST['rulers']))    ? json_decode($_POST['rulers'])    : array();

foreach ( $markers as $marker ) {
	array_push($output, $marker);
}
foreach ( $polylines as $polyline ) {
	array_push($output, $polyline);
}
foreach ( $polygons  as $polygon ) {
	array_push($output, $polygon);
}
foreach ( $circles   as $circle ) {
	array_push($output, $circle);
}
foreach ( $rulers    as $ruler ) {
	array_push($output, $ruler);
}

$geoJSON = json_encode(array(
	"type"              => "FeatureCollection",
	"name"              => "MaschinenLied",
	"scaleReference"    => (isset($_POST['scaleReference']))        ? (float) $_POST['scaleReference']        : 0,
	"magneticDeviation" => (isset($_POST['magneticDeviation']))     ? (float) $_POST['magneticDeviation']     : 0,
	"scaleUnits"        => (isset($_POST['scaleUnits']))            ? $_POST['scaleUnits']                    : "m",
	"scaleRuler"        => (isset($_POST['scaleRulerPixelLength'])) ? (int)   $_POST['scaleRulerPixelLength'] : 0,
	"bearing"           => (isset($_POST['bearing']))               ? (float) $_POST['bearing']               : 0,
	"deviation"         => (isset($_POST['deviation']))             ? (float) $_POST['deviation']             : 0,
	"anchorPoint"       => (isset($_POST['anchorPoint']))           ? array( 
																		"x" => (int) $_POST['anchorPoint']["x"],
																		"y" => (int) $_POST['anchorPoint']["y"]
																	)
																	: 0,
	"anchorPointProj"   => (isset($_POST['anchorPointProj']))       ? array(
																		"lat" => (float) $_POST['anchorPointProj']["lat"],
																		"lng" => (float) $_POST['anchorPointProj']["lng"]
																	) : 0,
	"crs"               => array(
		"type"          => "name",
		"properties"    => array(
			"name"      => "urn:ogc:def:crs:OGC:1.3:CRS84"
		)
	),
	"features"        => $output
));
file_put_contents("savedMaps/".$_POST['filename'], $geoJSON);
header("Content-type: application/json");
print $geoJSON;
?>