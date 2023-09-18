<?php $siteURL = $_SERVER['REQUEST_SCHEME']."://".$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']; ?>

<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="width=device-width,initial-scale=1">
		<meta property="vk:image" content="<?=$siteURL;?>images/1780.JPG">
		<meta property="og:title" content="Признак эпохи">
		<title></title>
		<link rel="stylesheet" href="<?=$siteURL;?>css/leaflet.css">
		<link rel="stylesheet" href="<?=$siteURL;?>css/map.css">
		<link rel="apple-touch-icon" type="image/png" sizes="180x180" href="<?=$siteURL;?>favicon/apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="<?=$siteURL;?>favicon/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="<?=$siteURL;?>favicon/favicon-16x16.png">
		<link rel="manifest"  href="<?=$siteURL;?>favicon/site.webmanifest">
		<link rel="mask-icon" href="<?=$siteURL;?>favicon/safari-pinned-tab.svg" color="#5bbad5">
		<meta name="msapplication-TileColor" content="#da532c">
		<meta name="theme-color" content="#ffffff">
	</head>

	<body>

		<table class="main" width="100%">
			<tr>
				<td class="controlPanel">
					<div class="header">
						Измерительная консоль&nbsp;&nbsp;&nbsp;&nbsp;<span class="clearMarkers">X</span>
					</div>

					<div class="controls">
						<div class="controlItem" ref="markers"><img   src="<?=$siteURL;?>images/bullet_red.png"></div>
						<div class="controlItem" ref="polylines"><img src="<?=$siteURL;?>images/layer-shape-polyline.png"></div>
						<div class="controlItem" ref="polygons"><img  src="<?=$siteURL;?>images/layer-shape-polygon.png"></div>
						<div class="controlItem" ref="circles"><img   src="<?=$siteURL;?>images/layer-shape-ellipse.png"></div>
						<div class="controlItem" ref="rulers">T</div>
					</div>
					<div class="data">
						<div class="markers"></div>
						<div class="polylines"></div>
						<div class="polygons"></div>
						<div class="circles"></div>
						<div class="rulers hide">
							<div class="techModeSwitchers">
								<span class="rulerMode active">SR</span>
								<span class="azimuthMode">AZ</span>
								<span class="anchorPointMode">AP</span>
							</div>
							<div class="header">
								Scale ruler&nbsp;&nbsp;&nbsp;&nbsp;<span class="resetSR">reset</span>
							</div>
							<table class="rulerPanel">
								<tr>
									<td>
										Scale Ruler Length:
									</td>
									<td style="width:100px">
										<input type="number" class="scaleRulerPixelLength" style="width:50px;">&nbsp;px
									</td>
								</tr>
								<tr>
									<td>Refers to: </td>
									<td><input type="text" id="inScaleUnits">&nbsp;units</td>
								</tr>
								<tr>
									<td>
										Units:
										<select id="units">
											<option value="m">метры</option>
											<option value="sag">сажени</option>
											<option value="yds">ярды</option>
											<option value="ft">футы</option>
											<option value="nm">морские мили</option>
											<option value="mi">береговые мили</option>
										</select>
									</td>
									<td>
										<input type="number" id="unitValue" step="0.01" style="width:50px;">&nbsp;м.
									</td>
								</tr>
							</table>
							<!-- <div class="rulerPanel"></div> -->
							<div class="header">
								Azimuth ruler&nbsp;&nbsp;&nbsp;&nbsp;<span class="resetAZ">reset</span>
							</div>

							<!-- <div class="rulerPanel"></div> -->
							<table class="rulerPanel">
								<tr>
									<td>
										Map rotation to TrueNorth:
									</td>
									<td style="width:100px">
										<span class="azimuthVectorDeviation"  title="Положение стрелки севера карты на истинный север">N/A</span> &deg;
									</td>
								</tr>
								<tr>
									<td>
										Bearing:
									</td>
									<td><span class="azimuthVectorBearing"  title="Поворот карты к проекции">N/A</span> &deg;</td>
								</tr>
								<tr>
									<td>
										Magnetic declination: 
									</td>
									<td>
										<input type="number" name="" min="-180" max="180" id="MD" step="0.1" value="0" style="width:50px;" title="Учесть магнитное склонение">&deg;
									</td>
								</tr>
							</table>

							<div class="header">
								Anchor Points&nbsp;&nbsp;&nbsp;&nbsp;<span class="resetAP">reset</span>
							</div>

							<table class="rulerPanel">
								<tr>
									<td>
										Planar Point [ x, y ]:
									</td>
									<td style="width:100px">
										<span class="anchorPoint"></span>
									</td>
								</tr>
								<tr>
									<td>
										Projection To [ lat, Lng ]
									</td>
									<td>
										<span class="anchorPointProj"></span>
									</td>
								</tr>
							</table>

							<div class="rulerPanel"></div>
						</div>
					</div>
					<span class="openMapSaver">Сохранить</span>
					<span class="openMapLoader">Загрузить</span>
				</td>
				<td id="LMapsID"></td>
			</tr>
			<tr>
				<td colspan=2 id="LMapsID2"></td>
			</tr>
		</table>

		<div class="mapfiles hide">
			<div class="header">Сохранённые схемы&nbsp;&nbsp;&nbsp;&nbsp;<span class="closeMapLoader">X</span></div>
			<div class="schemaList"></div>
		</div>

		<div class="saveMapFiles hide">
			<div class="header">Сохранённые схемы&nbsp;&nbsp;&nbsp;&nbsp;<span class="closeMapLoader">X</span></div>
			<input type="text" id="saveFilename"><span class="saveMap">Сохранить</span>
			<div class="schemaList"></div>
		</div>


		<script type="text/javascript">
			<?php
				$fileName = "1780-lf.jpg";
				exec('gdalinfo plans/'.$fileName.' | grep "Size is*"', $output);
				preg_match("/Size is (\d+)\,\s*(\d+)/", $output[0], $matches);
				//print_r($matches);
			?>

			var imgNativeWidth        = <?=$matches[1];?>,
				imgNativeHeight       = <?=$matches[2];?>,
				imageURL              = "<?=$siteURL;?>plans/<?=$fileName;?>";
		</script>

		<script type="text/javascript" src="<?=$siteURL;?>jscript/jquery.js"></script>
		<script type="text/javascript" src="<?=$siteURL;?>jscript/leaflet.js"></script>
		<script type="text/javascript" src="<?=$siteURL;?>jscript/leafletmapsutils.js"></script>
	</body>
</html>
