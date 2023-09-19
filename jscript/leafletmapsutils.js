$(".main").height( $(window).height() + 'px' );

var dataFileName          = "mapcontent.geojson",
	emptyName             = " -- ",
	workMode              = "markers",
	techMode              = "scaleRuler",
	units                 = "m",
	scaleReference        = 0,
	scaleRulerPixelLength = 0,
	bearing               = 0,
	deviation             = 0,
	maxZoom               = 2,
	magneticDeviation     = 3, //-11.5189,
	zoomCoef              = ( maxZoom > 1 ) ? Math.pow( 2, maxZoom - 2 ) : 1,
	iconProperties        = {
		redDot    : { iconUrl: imageFolder + 'bullet_red.png'   , iconSize: [16, 16], iconAnchor: [8, 8],popupAnchor: [0, 0]},
		whiteDot  : { iconUrl: imageFolder + 'bullet_white.png' , iconSize: [16, 16], iconAnchor: [8, 8],popupAnchor: [0, 0]},
		yellowDot : { iconUrl: imageFolder + 'bullet_yellow.png', iconSize: [16, 16], iconAnchor: [8, 8],popupAnchor: [0, 0]},
		blueDot   : { iconUrl: imageFolder + 'bullet_blue.png'  , iconSize: [16, 16], iconAnchor: [8, 8],popupAnchor: [0, 0]},
		blueFlag  : { iconUrl: imageFolder + 'pin_149059.png'   , iconSize: [32, 32], iconAnchor: [16, 32],popupAnchor: [16, 32]},
		redFlag   : { iconUrl: imageFolder + 'pin_660624.png'   , iconSize: [32, 32], iconAnchor: [16, 32],popupAnchor: [16, 32]},
	},
	redDot                = new L.Icon(iconProperties.redDot),
	whiteDot              = new L.Icon(iconProperties.whiteDot),
	yellowDot             = new L.Icon(iconProperties.yellowDot),
	blueDot               = new L.Icon(iconProperties.blueDot),
	blueFlag              = new L.Icon(iconProperties.blueFlag),
	redFlag               = new L.Icon(iconProperties.redFlag),
	rulerStyle            = { weight: 4, color: '#ff3300', opacity: 1 },
	azimuthStyle          = { weight: 4, color: '#0066cc', opacity: 1 },
	polylineStyle         = { weight: 3, color: '#FF5555', opacity: .9, interactive: false },
	polygonStyle          = { weight: 3, color: '#333366', opacity: .9, fill: true, fillOpacity: .05, interactive: false },
	circleStyle           = { weight: 3, color: '#00ff00', opacity: .9, fill: true, fillOpacity: .05 },
	unitsCollection       = {
		m   : "м.",
		sag : "саж.",
		yds : "ярд",
		ft  : "ф.",
		nm  : "м.м",
		mi  : "с.м"
	},
	unitsMultiplier       = {
		m   : 1,
		sag : 2.13,
		yds : .97,
		ft  : .30,
		nm  : 1852,
		mi  : 1609
	},
	map                   = L.map('LMapsID', {
		zoom              : -3,
		maxZoom           :  maxZoom,
		minZoom           : -6,
		center            : L.latLng( [0, 0] ),
		crs               : L.CRS.Simple,
	})
	.on('contextmenu', function( e ) {
		console.log( e.latlng.lat, e.latlng.lng );
	})
	.on('click'      , function( e ) {
		actions[workMode]( e );
		countPoints();
	}),
	map2                  = L.map('LMapsID2', {
		zoom              : 16,
		maxZoom           : 18,
		minZoom           : 4,
		center            : L.latLng( [64.54106203533401,40.52993774414063] ),
		crs               : L.CRS.EPSG3857,
	})
	.on('contextmenu', function( e ) {
		console.log( e.latlng.lat, e.latlng.lng );
	})
	.on('click'      , function( e ) {
		if ( workMode == "rulers" && techMode == "anchorPoint" ) {
			actions[workMode]( e );
		}
	}),
	anchorPointProj       = false,
	anchorPoint           = false,
	markerID              = false,
	polylineID            = false,
	polygonID             = false,
	circleID              = false,
	scaleRulerID          = false,
	azimuthVectorID       = false,
	anchorPointID         = false,
	anchorPointProjID     = false,
	circleID              = false,
	collection            = {
		markers           : new L.FeatureGroup().addTo( map ),
		polylines         : new L.FeatureGroup().addTo( map ),
		polygons          : new L.FeatureGroup().addTo( map ),
		circles           : new L.FeatureGroup().addTo( map ),
		aux               : new L.FeatureGroup().addTo( map ),
		rulers            : new L.FeatureGroup().addTo( map ),
		scaleRuler        : new L.FeatureGroup().addTo( map ),
		azimuth           : new L.FeatureGroup().addTo( map ),
		info              : new L.FeatureGroup().addTo( map ),
		anchorPoint       : new L.FeatureGroup().addTo( map ),
		anchorPointProj   : new L.FeatureGroup().addTo( map2 ),
		projected         : new L.FeatureGroup().addTo( map2 ),
	},
	southWest             = map.unproject( [0, imgNativeHeight], map.getMaxZoom() - 1 ),
	northEast             = map.unproject( [imgNativeWidth, 0],  map.getMaxZoom() - 1 ),
	bounds                = new L.LatLngBounds(southWest, northEast),
	osm                   = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">Участники OpenStreetMap</a>'
	}),
	actions               = {
		markers           : function(e) {
			addMarker(e.latlng);
		},
		polylines         : function(e) {
			addAuxNode(e.latlng, "polylines");
		},
		polygons          : function(e) {
			addAuxNode(e.latlng, "polygons");
		},
		circles           : function(e) {
			if ( circleID ) {
				return false;
			}
			addCircle(e.latlng);
		},
		rulers            : function(e) {
			if (techMode == "scaleRuler") {
				addRulerNode(e.latlng);
				return true;
			}
			if (techMode == "azimuth") {
				addAzimuthNode(e.latlng);
				return true;
			}
			if (techMode == "anchorPoint") {
				addAnchorPointNodes(e.latlng, e.target._container.id);
				return true;
			}
		}
	};
	osm.addTo(map2);

// taken from src https://github.com/makinacorpus/Leaflet.GeometryUtil
function getTargetPoint ( latlng, heading, distance ) {
	heading      = (heading + 360) % 360; // нормализация направления
	var rad      = Math.PI / 180,
		radInv   = 180 / Math.PI,
		R        = 6378137, // approximation of Earth's radius
		lon1     = latlng.lng * rad,
		lat1     = latlng.lat * rad,
		rheading = heading   * rad,
		sinLat1  = Math.sin(lat1),
		cosLat1  = Math.cos(lat1),
		cosDistR = Math.cos(distance / R),
		sinDistR = Math.sin(distance / R),
		lat2     = Math.asin(sinLat1 * cosDistR + cosLat1 * sinDistR * Math.cos(rheading)),
		lon2     = lon1 + Math.atan2(Math.sin(rheading) * sinDistR * cosLat1, cosDistR - sinLat1 * Math.sin(lat2));
	lon2         = lon2 * radInv;
	lon2         = (lon2 > 180) ? lon2 - 360 : (lon2 < -180) ? lon2 + 360 : lon2;
	return { lat: lat2 * radInv, lng: lon2 };
}

function setAnchorCoordinates(coordinates) {
	$(".anchorPoint").html( coordinates.x.toFixed(0) + ", " + coordinates.y.toFixed(0) );
}

function addAnchorPointNodes( point, sourceMap ) {
	if ( sourceMap == "LMapsID" ) {
		collection.anchorPoint.clearLayers();
		marker          = new L.Marker( point, { icon: redFlag, draggable: true } )
		.on('dragend', function(event) {
			anchorPoint = unprojectToXY( event.target.getLatLng() );
			setAnchorCoordinates(anchorPoint);
		})
		.addTo(collection.anchorPoint);
		anchorPointID   = collection.anchorPoint.getLayerId(marker);
		anchorPoint     = unprojectToXY( point );
		setAnchorCoordinates(anchorPoint)
	}
	if ( sourceMap == "LMapsID2" ) {
		collection.anchorPointProj.clearLayers();
		anchorPointProj = { lat: point.lat, lng: point.lng };
		marker          = new L.Marker(anchorPointProj, { icon: blueFlag, locals: anchorPointProj, draggable: true })
		.on('dragend', function(event) {
			coordinates = event.target.getLatLng();
			$(".anchorPointProj").html( coordinates.lat.toFixed(2) + "&hellip;, " + coordinates.lng.toFixed(2) + "&hellip;" );
			anchorPointProj = { lat: coordinates.lat, lng: coordinates.lng };
		})
		.addTo(collection.anchorPointProj);
		anchorPointProjID = collection.anchorPointProj.getLayerId(marker);
		$(".anchorPointProj").html( parseFloat(anchorPointProj.lat).toFixed(2) + "&hellip;, " + parseFloat(anchorPointProj.lng).toFixed(2) + "&hellip;" )
	}
}

function addMarker( latlng ) {
	var marker,
		clickPointXY   = unprojectToXY(latlng);
		clickPointXY.x = Math.round(clickPointXY.x);
		clickPointXY.y = Math.round(clickPointXY.y);
	marker             = new L.Marker(latlng, { icon: redDot, locals : clickPointXY, geometryType: "Point", name: emptyName, draggable: true })
	.on('dragend', function(event) {
		item                = event.target;
		item.options.locals = unprojectToXY( item.getLatLng() );
		item.setTooltipContent( name + " ("+ item.options.locals.x + "x" + item.options.locals.y + ")" );

		reprojectCollection();
	})
	.bindTooltip("("+ clickPointXY.x + "x" + clickPointXY.y + ")", { permanent: false })
	.addTo( collection.markers );

	reprojectCollection();
}

function calculateProjectedPoint( clickPointXY ) {
	var distance	= Math.sqrt(
		Math.pow( anchorPoint.x - clickPointXY.x, 2 ) +
		Math.pow( anchorPoint.y - clickPointXY.y, 2 )
	),
	RD			= (scaleReference / scaleRulerPixelLength ) * distance * parseFloat( $("#unitValue").val() ),
	AZ			= Math.atan2(
		(anchorPoint.x - clickPointXY.x),
		(anchorPoint.y - clickPointXY.y)
	) * 180 / Math.PI,
	NAZ			= ((AZ + deviation ) * -1) + parseFloat($("#MD").val());
	return getTargetPoint ( anchorPointProj, NAZ, RD );
}

function reprojectXYPointToMap(clickPointXY, name) {
	var projectedPoint	= calculateProjectedPoint( clickPointXY );

	Wmarker = new L.Marker( projectedPoint, { icon: blueDot, geometryType: "Point" } )
	.bindTooltip( name, { permanent: true } )
	.addTo( collection.projected );
}

function reprojectXYLineToMap(locals, name) {
	var geometry = [];
	for ( a in locals ) {
		clickPointXY = { x : locals[a][0] , y : locals[a][1] }
		//console.log(geometry);
		geometry.push( calculateProjectedPoint( clickPointXY ) );
	}
	//console.log(geometry);
	Wmarker		= new L.Polyline(geometry, { color: "#3333ff" , weight: 3, geometryType: "LineString" })
	.bindTooltip( name, {permanent: true} )
	.addTo( collection.projected );
}

function reprojectXYPolygonToMap(locals, name) {
	//console.log(locals);
	//return true;
	var geometry = [[]];
	for ( a in locals[0] ) {
		clickPointXY = { x : locals[0][a][0] , y : locals[0][a][1] }
		geometry[0].push( calculateProjectedPoint( clickPointXY ) );
	}
	Wmarker		= new L.Polygon(geometry, { color: "#00bb00" , weight: 3, fillColor: "#eeeeee", fillOpacity: 0.1, geometryType: "Polygon" })
	.bindTooltip( name, {permanent: true} )
	.addTo( collection.projected );
}

function reprojectXYCircleToMap(locals, name) {
	//console.log(locals);
	//return true;
	var center   = calculateProjectedPoint( { x : locals[0] , y : locals[1] } ),
		radial   = calculateProjectedPoint( { x : locals[2] , y : locals[3] } ),
		raduis   = L.CRS.EPSG3857.distance(center, radial);

	Wmarker		 = new L.Circle(center, { radius: radius, color: "#ff9900" , weight: 3, fillColor: "#ffff99", fillOpacity: 0.1, geometryType: "Circle" })
	.bindTooltip( name, {permanent: true} )
	.addTo( collection.projected );
}

function reprojectCollection() {
	if ( !anchorPoint || !anchorPointProj ) {
		return false;
	}
	collection.projected.clearLayers();
	if ( collection.markers.getLayers().length ) {
		collection.markers.eachLayer(function( item ) {
			reprojectXYPointToMap(item.options.locals, item.options.name);
		});
	}
	if ( collection.polylines.getLayers().length ) {
		collection.polylines.eachLayer(function( item ) {
			reprojectXYLineToMap(item.options.locals, item.options.name);
		});
	}
	//console.log(collection.polygons.getLayers().length)
	if ( collection.polygons.getLayers().length ) {
		collection.polygons.eachLayer(function( item ) {
			reprojectXYPolygonToMap(item.options.locals, item.options.name);
		});
	}
	if ( collection.circles.getLayers().length ) {
		collection.circles.eachLayer(function( item ) {
			reprojectXYCircleToMap(item.options.locals, item.options.name);
		});
	}
}

function addRulerNode( latlng ) {
	if ( collection.scaleRuler.getLayers().length > 1 ) {
		return false;
	}
	var rulerMarker,
		clickPointXY   = unprojectToXY(latlng);
	rulerMarker        = new L.Marker(latlng, { icon: whiteDot, locals : clickPointXY, draggable: true })
	.on("dragend", function(){
		redrawDrawings();
	})
	.bindTooltip("<-->", {permanent: false})
	.addTo(collection.scaleRuler);
	redrawDrawings();
}

function addAzimuthNode( latlng ) {
	if ( collection.azimuth.getLayers().length > 1 ) {
		return false;
	}
	var azimuthMarker,
		type           = ( !collection.azimuth.getLayers().length ) ? "init" : "dest",
		clickPointXY   = unprojectToXY(latlng);
	azimuthMarker      = new L.Marker(latlng, { icon: whiteDot, locals : clickPointXY, type: type, draggable: true })
	.on("dragend", function(){
		redrawDrawings();
	})
	.bindTooltip("<-->", {permanent: false})
	.addTo(collection.azimuth);
	redrawDrawings();
}

function addAuxNode( latlng, type ) {
	var types = {
			"polylines" : yellowDot,
			"polygons"  : blueDot
		}
		order          = collection.aux.getLayers().length.toString(),
		clickPointXY   = unprojectToXY(latlng),
		polylineMarker = new L.Marker(latlng, { icon: types[type], locals : clickPointXY, order : order, draggable: true })
		.on("dragend", function(){
			redrawDrawings();
		})
		.bindTooltip(order + " " + clickPointXY.x + ", " + clickPointXY.y, {permanent: false})
		.addTo(collection.aux);
	redrawDrawings();
}

function makeCircleMarker(center, locals, type) {
	new L.Marker(center, { icon: blueDot, locals : locals, draggable: true, type : type })
	.on("dragend", function(event) {
		dragXY   = unprojectToXY(event.target.getLatLng());
		event.target.setTooltipContent("type: " + type + " " + dragXY.x + ", " + dragXY.y);
		redrawDrawings();
	})
	.bindTooltip("type: " + type + " " + locals.x + ", " + locals.y, {permanent: false, direction : (type === "c") ? "left" : "right"})
	.addTo(collection.aux);
}

function addCircle( latlng, radius ) {
	var clickPointXY = unprojectToXY(latlng),
		radialXY     = (radius === undefined)
			? { x : clickPointXY.x + 350, y : clickPointXY.y }
			: unprojectToXY({ lat : latlng.lat, lng : latlng.lng  + radius }),
		radialLatLng = (radius === undefined)
			? projectFromXY(radialXY)
			: { lat : latlng.lat, lng : latlng.lng + radius },
		centerMarker = makeCircleMarker(latlng,       clickPointXY, "c");
		radiusMarker = makeCircleMarker(radialLatLng, radialXY,     "r");

	redrawDrawings();
}

function unprojectToXY( latlng ) {
	var coords = L.CRS.Simple.latLngToPoint(latlng);
	return {
		x      : Math.round(coords.x * imgNativeWidth  / bounds._northEast.lng, 1),
		y      : Math.round(coords.y * imgNativeHeight / bounds._southWest.lat * -1, 1)
	}
}

function projectFromXY( XYpoint ) {
	var point  = new L.point(
			XYpoint.x / imgNativeWidth  * bounds._northEast.lng,
			XYpoint.y / imgNativeHeight * bounds._southWest.lat * -1
		);
	latLng     = L.CRS.Simple.pointToLatLng(point);
	return latLng;
}

function abPixelDistance( aPoint, bPoint ) {
	return Math.sqrt(
		Math.pow(Math.round(aPoint.lat - bPoint.lat), 2) +
		Math.pow(Math.round(aPoint.lng - bPoint.lng), 2)
	);
}

function returnMarkerItem(mode, layerID, options, active){
	console.log(mode)
	var icons = {
		markers   : "bullet_red.png",
		polylines : "layer-shape-polyline.png",
		polygons  : "layer-shape-polygon.png",
		circles   : "layer-shape-ellipse.png",
	}
	return '<div class="markerItem' + active + '" collection="' + mode + '" layerID="' + layerID + '">' +
		'<img src="' + imageFolder + icons[mode] + '"> #' + layerID + " " +
		'<input type="text" collection="' + mode + '" layerID="' + layerID + '" class="featureName" value="' + ((options.name === undefined) ? emptyName : options.name) + '">' +
		'<span collection="' + mode + '" class="saveFeature"   title="Завершить редактирование" layerID="' + layerID + '">S</span>' +
		((mode == "marker")
			? ''
			:'<span collection="' + mode + '" class="editFeature"   title="Редактировать объект" layerID="' + layerID + '">E</span>') +
		'<span collection="' + mode + '" class="deleteFeature" title="Удалить объект" layerID="' + layerID + '">D</span>' +
		'</div>';
}

function countPoints() {
	var list = ["markers", "polylines", "polygons", "circles"];
	$("." + list.join(", .")).empty();
	for (a in list ) {
		collection[list[a]].eachLayer(function(item) {
			var layerID = collection[list[a]].getLayerId(item);
			active  = (layerID == polylineID) ? " active" : ""; //???????????? как определить активную фичу!
			string = returnMarkerItem(list[a], layerID, item.options, active);
			$("." + list[a]).append( string );
		});
	}
	setMarkerItemClickEvent();
	setEditEvent();
	setDeleteEvent();
	setSaveEvent();
}

function setDeleteEvent() {
	$(".deleteFeature").unbind().click(function() {
		var collectionName = $(this).attr("collection"),
			layerID        = parseInt($(this).attr("layerID"), 10);
		collection[collectionName].removeLayer(layerID);
		collection.aux.clearLayers();
		countPoints();
		redrawDrawings();
		//console.log(collection[collectionName].getLayers().length);
	});
}

function setEditEvent() {
	$(".editFeature").unbind().click(function() {
		var collectionName = $(this).attr("collection"),
			layerID        = parseInt($(this).attr("layerID"), 10);
		workMode           = collectionName;
		collection.aux.clearLayers();
		feature            = collection[collectionName].getLayer(layerID);
		if (collectionName == "polylines") {
			polylineID     = layerID;
			coords         = feature.getLatLngs();
			for ( a in coords ) {
				addAuxNode(coords[a], collectionName);
			}
		}
		if (collectionName == "polygons") {
			polygonID      = layerID;
			coords         = feature.getLatLngs();
			for ( a in coords[0] ) {
				addAuxNode(coords[0][a], collectionName);
			}
		}
		if (collectionName == "circles") {
			circleID       = layerID;
			coords         = feature.getLatLng();
			radius         = feature.getRadius();
			addCircle(coords, radius)
		}
		countPoints();
	});
}

function setSaveEvent() {
	$(".saveFeature").unbind().click( function() {
		var collectionName = $(this).attr("collection"),
			layerID        = parseInt($(this).attr("layerID"), 10),
			featureName    = $(".featureName[layerID=" + layerID + "]").val();
		map.closePopup();
		resetDrawing();
		if ( featureName === undefined ) {
			countPoints();
			return true;
		}
		collection[collectionName].getLayer(layerID).options.name = featureName;
		collection[collectionName].getLayer(layerID).setTooltipContent(featureName);
		collection[collectionName].getLayer(layerID).bindPopup(getForm(collectionName, layerID, collection[collectionName].getLayer(layerID)));
		countPoints();
	});
}

function fillFromCollection(item, targetFeature) {
	item.options.locals      = unprojectToXY(item.getLatLng());
	item.setTooltipContent( item.options.locals.x + "x" + item.options.locals.y );
	targetFeature.addLatLng( item.getLatLng() );
	targetFeature.options.locals.push([ item.options.locals.x, item.options.locals.y ]);
}

function redrawDrawings() {
	collection.info.clearLayers();
	if ( workMode == "polylines" ) {
		if ( !polylineID ) {
			polyline = new L.polyline([], { locals: [], geometryType: "LineString", name: emptyName })
			.setStyle(polylineStyle)
			.on("popupopen", function(){
				setSaveEvent();
			}).addTo(collection[workMode]);
			polylineID = collection[workMode].getLayerId(polyline);
			polyline.bindPopup(getForm(workMode, polylineID, polyline));
		}
		polyline                 = collection[workMode].getLayer(polylineID);
		polyline.options.locals  = [];
		polyline.options.layerID = polylineID;
		polyline.setLatLngs([]);
		polyline.bindPopup(getForm(workMode, polylineID, polyline));

		collection.aux.eachLayer( function(item) {
			fillFromCollection( item, polyline );
		});
		placeInfo(polyline.options.locals, polyline.options.geometryType);
		//console.log(polyline.options);
	}
	if ( workMode == "polygons" ) {
		if ( !polygonID ) {
			polygon   = new L.polygon([[]], { locals: [], geometryType: "Polygon", name: emptyName })
			.setStyle(polygonStyle)
			.on("popupopen", function(){
				setSaveEvent();
			}).addTo(collection[workMode]);
			polygonID = collection[workMode].getLayerId(polygon);
			polygon.bindPopup(getForm(workMode, polygonID, polygon));
		}
		polygon                 = collection[workMode].getLayer(polygonID);
		polygon.options.locals  = [[]];
		polygon.options.layerID = polygonID;
		polygon.setLatLngs([]);
		polygon.bindPopup(getForm(workMode, polygonID, polygon));

		collection.aux.eachLayer(function(item) {
			item.options.locals = unprojectToXY(item.getLatLng());
			item.setTooltipContent(item.options.order + " " + item.options.locals.x + ", " + item.options.locals.y);
			polygon.addLatLng(item.getLatLng());
			polygon.options.locals[0].push([ item.options.locals.x, item.options.locals.y ]);
		});
		placeInfo(polygon.options.locals[0], polygon.options.geometryType);
	}
	if ( workMode == "circles"   ) {
		var aPoint,
			bPoint;
		collection.aux.eachLayer(function(item){
			if (item.options.type == "c") {
				aPoint   = item.getLatLng();
				centerXY = unprojectToXY( aPoint );
			}
			if (item.options.type == "r") {
				bPoint   = item.getLatLng();
				radialXY = unprojectToXY( bPoint );
			}
		});
		radius = abPixelDistance( aPoint, bPoint );
		if ( !circleID ) {
			circle           = new L.circle(aPoint, {
				locals       : [centerXY.x, centerXY.y, radialXY.x, radialXY.y],
				name         : emptyName,
				draggable    : false,
				radius       : radius,
				geometryType : "Circle"
			})
			.setStyle(circleStyle)
			.on("popupopen", function() {
				setSaveEvent();
			})
			.addTo(collection[workMode]);
			circleID               = collection[workMode].getLayerId(circle);
			circle.options.layerID = circleID;
			circle.bindPopup(getForm(workMode, circleID, circle))
		}
		circle                = collection[workMode].getLayer(circleID);
		circle.options.radius = radius;
		circle.options.locals = [ centerXY.x, centerXY.y, radialXY.x, radialXY.y ];
		circle.setLatLng(aPoint);
		circle.setRadius(radius);
		circle.bindPopup(getForm(workMode, circleID, circle));
	}
	if ( workMode == "rulers"    ) {
		if (techMode == "scaleRuler") {
			if ( !scaleRulerID ) {
				scaleRuler   = new L.polyline([], { locals: [], geometryType: "LineString", type : techMode, name: techMode })
				.setStyle(rulerStyle)
				.addTo(collection[workMode]);
				scaleRulerID = collection[workMode].getLayerId(scaleRuler);
			}
			scaleRuler                = collection[workMode].getLayer(scaleRulerID);
			scaleRuler.options.locals = [];
			scaleRuler.setLatLngs( [] );
			collection.scaleRuler.eachLayer( function( item ) {
				item.options.locals   = unprojectToXY( item.getLatLng() );
				item.setTooltipContent( item.options.locals.x + "x" + item.options.locals.y );
				scaleRuler.addLatLng( item.getLatLng() );
				scaleRuler.options.locals.push( [ item.options.locals.x, item.options.locals.y ] );
			});
			if ( scaleRuler.options.locals[1] === undefined ) {
				return false;
			}
			scaleRulerPixelLength = Math.round(
				Math.sqrt(
					Math.pow( scaleRuler.options.locals[0][0] - scaleRuler.options.locals[1][0], 2 ) + Math.pow( scaleRuler.options.locals[0][1] - scaleRuler.options.locals[1][1], 2 )
				)
			);
			$(".scaleRulerPixelLength").val(scaleRulerPixelLength);
		}
		if ( techMode == "azimuth" ) {
			if ( !azimuthVectorID ) {
				azimuthVector = new L.polyline([], { locals: [], geometryType: "LineString", type : techMode, name: techMode })
				.setStyle(azimuthStyle)
				.addTo(collection[workMode]);
				azimuthVectorID = collection[workMode].getLayerId(azimuthVector);
			}
			azimuthVector                = collection[workMode].getLayer(azimuthVectorID);
			azimuthVector.options.locals = [];
			azimuthVector.setLatLngs([]);

			collection.azimuth.eachLayer( function(item) {
				fillFromCollection( item, azimuthVector )
			});
			if ( azimuthVector.options.locals[1] === undefined ) {
				return false;
			}
			deviation = Math.atan2(
				(azimuthVector.options.locals[0][0] - azimuthVector.options.locals[1][0]) * -1,
				(azimuthVector.options.locals[0][1] - azimuthVector.options.locals[1][1])
			) * 180 / Math.PI ;

			deviation = Math.round(deviation * 100) / 100;

			bearing   =  (deviation >= 0)
				? Math.round(deviation * 100) / 100
				: Math.round((360 + deviation) * 100) / 100;
			//console.log(deviation, bearing);

			$(".azimuthVectorBearing").html(bearing);
			$(".azimuthVectorDeviation").html(deviation);
		}
	}

	countPoints();
	reprojectCollection();
}

function getForm( collection, layerID, item ) {
	var name = (item.options.name === undefined) ? '' : item.options.name;
	return 'Название: ' + name;
}

function setMarkerItemClickEvent() {
	$(".markerItem").unbind().click(function() {
		collectionName = $(this).attr("collection"),
		layerID        = parseInt($(this).attr("layerID"), 10),
		layer          = collection[collectionName].getLayer(layerID);
		layer.bindPopup().setPopupContent(layer.options.name).openPopup();
	});
}

function resetDrawing() {
	markerID          = false;
	polylineID        = false;
	polygonID         = false;
	circleID          = false;
	anchorPointID     = false;
	anchorPointProjID = false;
	collection.aux.clearLayers();
	countPoints();
}

function clearCollections() {
	collection.aux.clearLayers();
	collection.info.clearLayers();
	collection.markers.clearLayers();
	collection.circles.clearLayers();
	collection.polygons.clearLayers();
	collection.polylines.clearLayers();
	collection.anchorPoint.clearLayers();
	collection.anchorPointProj.clearLayers();
	countPoints();
}

function convertToGeoJSON( layerGroup ) {
	var features = layerGroup.getLayers(),
		output   = [];
	if (!features.length) {
		return [];
	}
	for ( a in features ) {
		feature  = features[a];
		object   = {
			type            : "Feature",
			geometry        : {
				type        : feature.options.geometryType,
				coordinates : (feature.options.geometryType == "Point" || feature.options.geometryType == "Circle" )
					? feature.getLatLng()
					: feature.getLatLngs()
			},
			properties      : feature.options
		};
		output.push(object);
	}
	return JSON.stringify(output);
}

function convertFromGeoJSON( data ) {
	for ( a in data.features ) {
		feature = data.features[a];
		if (feature.properties.type !== undefined && feature.properties.type == "scaleRuler") {
			coordinates = feature.geometry.coordinates;
			workMode    = "rulers";
			techMode    = "scaleRuler";
			for ( a in coordinates ) {
				addRulerNode(coordinates[a]);
			}
			continue;
		}
		if (feature.properties.type !== undefined && feature.properties.type == "azimuthVector") {
			coordinates = feature.geometry.coordinates;
			workMode    = "rulers";
			techMode    = "azimuth"
			for ( a in coordinates ) {
				addAzimuthNode(coordinates[a]);
			}
			continue;
		}
		if (feature.geometry.type == "Point") {
			feature.properties.icon = new L.Icon(feature.properties.icon.options);
			object = new L.Marker(feature.geometry.coordinates, feature.properties)
			.bindTooltip(feature.properties.name, {permanent: true})
			.addTo(collection.markers);
		}
		if (feature.geometry.type == "LineString") {
			object = new L.polyline(feature.geometry.coordinates, feature.properties)
			.bindTooltip(feature.properties.name, {permanent: true})
			.addTo(collection.polylines);
			placeInfo(feature.properties.locals, feature.properties.geometryType);
		}
		if (feature.geometry.type == "Polygon") {
			object = new L.polygon(feature.geometry.coordinates, feature.properties)
			.bindTooltip(feature.properties.name, {permanent: true})
			.addTo(collection.polygons);
			placeInfo(feature.properties.locals[0], feature.properties.geometryType);
		}
		if (feature.geometry.type == "Circle") {
			//console.log("circ");
			object = new L.circle(feature.geometry.coordinates, feature.properties)
			.bindTooltip(feature.properties.name, {permanent: true})
			.addTo(collection.circles);
			//placeInfo(feature.properties.locals, feature.properties.geometryType);
		}
		reprojectCollection();
	}
}

function placeInfoMarker( pointNow, pointNext ) {
	//console.log(pointNow, pointNext);
	infoDivXYpoint  = {
		x    : (pointNow[0] + pointNext[0]) / 2,
		y    : (pointNow[1] + pointNext[1]) / 2
	}
	divPositionLatLng = projectFromXY(infoDivXYpoint);

	lengthXY = Math.round(
		Math.sqrt(
			Math.pow(pointNow[0] - pointNext[0], 2) +
			Math.pow(pointNow[1] - pointNext[1], 2)
		)
	);
	localDeviation = Math.atan2(
		(pointNext[0] - pointNow[0]),
		(pointNext[1] - pointNow[1])
	) * 180 / Math.PI ;
	localDeviation = Math.round(localDeviation * 100) /100;
	azimuth        = (deviation - localDeviation);
	//azimuth      = ( azimuth > 360 ) ? 180 + azimuth : azimuth;
	azimuth        = Math.round(azimuth * 100) / 100;

	//azimuth        = ( azimuth < 0 ) ? azimuth + 180 : azimuth;
	//azimuth        = ( azimuth > 360 ) ? 360 - (360 - azimuth) : azimuth - 180;

	lengthReal = Math.round(lengthXY * scaleReference / scaleRulerPixelLength / zoomCoef * 100 ) / 100;
	L.marker(divPositionLatLng, {
		icon: new L.divIcon({
			className : "label-C",
			//html    : "dev: " + azimuth + "(" + ( 180 + localDeviation) + ") " + lengthReal + " саж."
			//html      : "az:&nbsp;" + azimuth + "&nbsp;(" + ( 180 - localDeviation) + ")&nbsp;" + lengthReal + "&nbsp;саж."
			html      : azimuth + "&deg; " + lengthReal + "&nbsp;" + unitsCollection[units]
		})
	}).addTo(collection.info);
}

function placeInfo( locals, geometryType ) {
	//console.log(locals);
	pointNow         = false;
	pointNext        = false;
	for ( a in locals ) {
		pointNow     = pointNext;
		pointNext    = locals[a];
		if (pointNow && pointNext) {
			placeInfoMarker(pointNow, pointNext);
		}
		if (geometryType == "Polygon") {
			//console.log(locals[locals.length - 1], locals[0])
			placeInfoMarker(locals[locals.length - 1], locals[0]);
		}
	}
}

function saveMap( datafile ) {
	//console.log(datafile, anchorPointProj, anchorPoint)
	$.ajax({
		url                       : "save.php",
		type                      : "POST",
		data                      : {
			anchorPoint           : anchorPoint,
			anchorPointProj       : anchorPointProj,
			filename              : datafile,
			magneticDecliniation  : $("#MD").val(),
			scaleReference        : $("#inScaleUnits").val(),
			scaleUnits            : $("#units").val(),
			scaleRulerPixelLength : scaleRulerPixelLength,
			bearing               : bearing,
			deviation             : deviation,
			markers               : convertToGeoJSON(collection.markers),
			polylines             : convertToGeoJSON(collection.polylines),
			polygons              : convertToGeoJSON(collection.polygons),
			circles               : convertToGeoJSON(collection.circles),
			rulers                : convertToGeoJSON(collection.rulers)
		},
		dataType                  : "json",
		success                   : function(data) {
			//console.log(data);
		},
		error                     : function(data, stat, err) {
			console.error(data, stat, err);
		}
	});
}

function loadMap( dataFile ) {
	$.ajax({
		url           : "savedMaps/" + dataFile,
		type          : "GET",
		cache         : false,
		dataType      : "json",
		success       : function(data) {
			$(".markers, .polylines, .polygons, .circles").empty();
			workMode               = "markers";
			$("#MD").val(0);
			clearCollections();
			scaleRulerPixelLength  = parseFloat(data.scaleRuler);
			scaleReference         = parseFloat(data.scaleReference);
			bearing                = parseFloat(data.bearing);
			deviation              = parseFloat(data.deviation);
			units                  = data.scaleUnits;
			dataFileName           = dataFile;
			if ( data.anchorPoint !== undefined ) {
				addAnchorPointNodes( projectFromXY( data.anchorPoint ), "LMapsID" );
			}
			if ( data.anchorPointProj !== undefined ) {
				addAnchorPointNodes( data.anchorPointProj, "LMapsID2" );
			}
			if ( data.magneticDeclination !== undefined ) {
				$("#MD").val(data.magneticDeclniation);
			}
			$(".scaleRulerPixelLength").val(scaleRulerPixelLength);
			$("#inScaleUnits").val(scaleReference);
			$("#units option[value=" + units + "]").prop("selected", true);
			$("#units").change();
			convertFromGeoJSON(data);

			collection.rulers.removeFrom(map);
			collection.scaleRuler.removeFrom(map);
			collection.azimuth.removeFrom(map);
			countPoints();
		},
		error         : function(data, stat, err) {
			console.error(data, stat, err);
		}
	});
}

function closeMapLoader() {
	$(".mapfiles, .saveMapFiles").addClass("hide");
}

$(".controlItem").click(function() {
	resetDrawing();
	workMode   = $(this).attr("ref");
	$(".controlItem").removeClass("active");
	$(this).addClass("active");
	if (workMode !== "rulers") {
		collection.rulers.removeFrom(map);
		collection.scaleRuler.removeFrom(map);
		collection.azimuth.removeFrom(map);
	}
	if ( workMode == "rulers" ) {
		collection.rulers.addTo(map);
		collection.scaleRuler.addTo(map);
		collection.azimuth.addTo(map);
		$(".markers, .polylines, .polygons, .circles").addClass("hide");
		$(".rulers").removeClass("hide");
		return true;
	}
	$(".markers, .polylines, .polygons, .circles").removeClass("hide");
	$(".rulers").addClass("hide");
});

$(".clearMarkers").click(function() {
	clearCollections();
});

function switchActiveness(targetNode) {
	$(".azimuthMode, .rulerMode, .anchorPointMode").removeClass("active");
	$(targetNode).addClass("active");
}

$(".azimuthMode").click(function() {
	techMode = "azimuth";
	switchActiveness($(this));
});

$(".rulerMode").click(function() {
	techMode = "scaleRuler";
	switchActiveness($(this));
});

$(".anchorPointMode").click(function() {
	techMode = "anchorPoint";
	switchActiveness($(this));
});

$("#MD").change(function() {
	reprojectCollection();
});

$("#units").change(function() {
	var units = $(this).val();
	$("#unitValue").val(unitsMultiplier[units]);
	reprojectCollection();
});

$("#unitValue").change(function() {
	reprojectCollection();
});

$(".scaleRulerPixelLength").change(function() {
	scaleRulerPixelLength = parseFloat( $(this).val() );
	reprojectCollection();
});

$(".resetSR").click(function() {
	techMode = "scaleRuler";
	$(".scaleRulerPixelLength").val("0");
	$("#inScaleUnits").val("");
	$(".azimuthMode, .rulerMode").removeClass("active");
	$(".rulerMode").addClass("active");
	collection.scaleRuler.clearLayers();
	redrawDrawings();
});

$(".resetAZ").click(function() {
	techMode = "azimuth";
	$(".azimuthVectorDeviation, .azimuthVectorBearing").empty();
	$(".azimuthMode, .rulerMode").removeClass("active");
	$(".azimuthMode").addClass("active");
	collection.azimuth.clearLayers();
	redrawDrawings();
});

$(".openMapLoader").click(function() {
		$.ajax({
		url           : "listfiles.php",
		type          : "GET",
		cache         : false,
		dataType      : "json",
		success       : function(data) {
			$(".schemaList").empty();
			makeFileList(data, "loadMap");
			$(".mapfiles").removeClass("hide");
			$(".loadMap").unbind().click(function() {
				var dataFile = ($(this).attr("filename") === undefined) ? dataFileName : $(this).attr("filename");
				loadMap(dataFile);
				closeMapLoader()
			});
		},
		error         : function(data, stat, err) {
			console.error(data, stat, err);
		}
	});
});

function makeFileList(data, className) {
	for (a in data) {
		$(".schemaList").append('<div class="' + className + '" filename="' + data[a] + '">' + data[a] + '</div>')
	}
}

$(".openMapSaver").click(function() {
		$.ajax({
		url           : "listfiles.php",
		type          : "GET",
		cache         : false,
		dataType      : "json",
		success       : function(data) {
			$(".schemaList").empty();
			makeFileList(data, "saveMe");
			$(".saveMe").click(function(){
				$("#saveFilename").val($(this).attr("filename"));
			});
			$("#saveFilename").val(dataFileName);
			$(".saveMapFiles").removeClass("hide");
			$(".saveMap").unbind().click(function() {
				var dataFile = $("#saveFilename").val();
				saveMap(dataFile);
				closeMapLoader()
			});
		},
		error         : function(data, stat, err) {
			console.error(data, stat, err);
		}
	});
});

$(".closeMapLoader").click(function() {
	closeMapLoader();
});
/*
$( ".controlPanel" ).draggable({ //handle: "controlPanel > .header"
});
*/
$("#units").change();
$(".controlItem[ref=" + workMode + "]").click();
L.imageOverlay( imageURL, bounds, { attribution: "www.signumtemporis.ru, Федеральное казённое учреждение \"Российский государственный архив военно-морского флота\" (РГАВМФ), Санкт-Петербург, 2023 г. | Ф. 3/Л, Оп. 23, Д. 853. Л. XXXVII | Общественное достояние по ст. 1282 ГК РФ" } ).addTo( map );
map.setMaxBounds( bounds );
