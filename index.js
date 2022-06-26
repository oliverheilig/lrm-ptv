var clusterName = 'xserver2-test';
var scenario = 'm';

var baseLayers;
var routingControl;

// initialize the map
var map = L.map('map', {
	fullscreenControl: true,
	fullscreenControlOptions: {
		fullscreenElement: document.getElementById('map-container').parentNode // needed for sidebar!
	},
	contextmenu: true,
	contextmenuWidth: 200,
	contextmenuItems: [{
		text: 'Add Waypoint At Start',
		callback: function (ev) {
			if (routingControl._plan._waypoints[0].latLng) {
				routingControl.spliceWaypoints(0, 0, ev.latlng);
			} else {
				routingControl.spliceWaypoints(0, 1, ev.latlng);
			}
		}
	}, {
		text: 'Add Waypoint At End',
		callback: function (ev) {
			if (routingControl._plan._waypoints[routingControl._plan._waypoints.length - 1].latLng) {
				routingControl.spliceWaypoints(routingControl._plan._waypoints.length, 0, ev.latlng);
			} else {
				routingControl.spliceWaypoints(routingControl._plan._waypoints.length - 1, 1, ev.latlng);
			}
		}
	}]
});

// create a new pane for the overlay tiles
map.createPane('tileOverlayPane');
map.getPane('tileOverlayPane').style.zIndex = 500;
map.getPane('tileOverlayPane').style.pointerEvents = 'none';

// get the start and end coordinates for a scenario
var getPlan = function () {
	switch (scenario) {
	case 'm':
	{
		return [
			L.latLng(48.10032397915225, 11.547317504882812),
			L.latLng(48.167001359708934, 11.602249145507814)
		];
	}
	case 'hh':
	{
		return [
			L.latLng(53.55145062603612, 9.934816360473632),
			L.latLng(53.52796226132062, 9.84975814819336)
		];
	}
	case 'na':
	{
		return [
			L.latLng(40.71454, -74.00711),
			L.latLng(42.35867, -71.05672)
		];
	}
	case 'au':
	{
		return [
			L.latLng(-33.86959, 151.20694),
			L.latLng(-35.3065, 149.12659)
		];
	}
	default:
	{ // 'eu'	
		return [
			L.latLng(48.8588, 2.3469),
			L.latLng(52.3546, 4.9039)
		];
	}
	}
};

// returns a layer group for xmap back- and foreground layers
var getXMapBaseLayers = function (style) {
	var bg = L.tileLayer('https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?style={style}&apiKey={apiKey}', {
		style: style,
		apiKey: apiKey,
		maxZoom: 23
	});

	return L.layerGroup([bg]);
}

var initializeRoutingControl = function () {
	routingControl = L.Routing.control({
		plan: L.Routing.plan(getPlan(), {
			createMarker: function (i, wp) {
				return L.marker(wp.latLng, {
					draggable: true,
					icon: L.icon.glyph({
						glyph: String.fromCharCode(65 + i)
					})
				});
			},
			geocoder: L.Control.Geocoder.ptv({
				serviceUrl: 'https://api.myptv.com',
				apiKey: apiKey,
			}),
			reverseWaypoints: true
		}),
		lineOptions: {
			styles: [
				// Shadow
				{
					color: 'grey',
					opacity: 0.8,
					weight: 15
				},
				// Outline
				{
					color: 'white',
					opacity: 1,
					weight: 9
				},
				// Center
				{
					color: 'lightblue',
					opacity: 1,
					weight: 6
				}
			]
		},
		router: L.Routing.ptv({
			serviceUrl: 'https://api.myptv.com/',
			apiKey: apiKey
		}),
		collapsible: true,
		routeWhileDragging: false,
		routeDragInterval: 1000,
		formatter: new L.Routing.Formatter({
			roundingSensitivity: 1000
		})
	}).addTo(map);

	routingControl.on('routingerror', function (e) {});

	L.Routing.errorControl(routingControl).addTo(map);
};

// update ui
$('#scenarioSelect').val(scenario);

var sidebar = L.control.sidebar('sidebar').addTo(map);
sidebar.open('home');

// add scale control
L.control.scale().addTo(map);

var baseLayers = {
	'PTV gravelpit': getXMapBaseLayers('gravelpit'),
	'PTV sandbox': getXMapBaseLayers('sandbox'),
	'PTV silkysand': getXMapBaseLayers('silkysand'),
	'PTV classic': getXMapBaseLayers('classic'),
	'PTV blackmarble': getXMapBaseLayers('blackmarble'),
	'PTV silica': getXMapBaseLayers('silica').addTo(map)
};

L.control.layers(baseLayers, {}, {
	position: 'bottomleft',
	autoZIndex: false
}).addTo(map);

var _onMapLoad = function (e) {
	initializeRoutingControl();
};

map.on('load', _onMapLoad, this);
map.setView([0, 0], 1);


// update the map scenario
var updateScenario = function () {
	scenario = $('#scenarioSelect option:selected').val();
	updateParams(true);
};

// update the routing params
var updateParams = function (updateWayPoints) {
	if (updateWayPoints)
	{routingControl.setWaypoints(getPlan());}
	routingControl._router.options.numberOfAlternatives = 0;
	routingControl.route();
};
