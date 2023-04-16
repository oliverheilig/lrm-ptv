var clusterName = 'xserver2-test';
var scenario = 'EUR';
var routingProfile = 'EUR_CAR';
var useImperial = false;
var realisticTraffic = false;

var baseLayers;
var routingControl;
var optionsCache = [];

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

// get the start and end coordinates for a scenario
var getPlan = function () {
	switch (scenario) {
		case 'USA':
			{
				return [
					L.latLng(40.71454, -74.00711),
					L.latLng(42.35867, -71.05672)
				];
			}
		case 'AUS':
			{
				return [
					L.latLng(-33.86959, 151.20694),
					L.latLng(-35.3065, 149.12659)
				];
			}
		case 'IMEA':
			{
				return [
					L.latLng(30.056111, 31.239444),
					L.latLng(25.266667, 55.3)
				];
			}
		default:
			{ // 'EUR'	
				return [
					L.latLng(48.8588, 2.3469),
					L.latLng(52.3546, 4.9039)
				];
			}
	}
};

// returns a layer group for xmap back- and foreground layers
var getXMapBaseLayers = function (style) {
	if(style === 'satellite') {
		var satlayer = L.tileLayer('https://api.myptv.com/rastermaps/v1/satellite-tiles/{z}/{x}/{y}?apiKey={apiKey}', {
			apiKey: apiKey,
			maxZoom: 22,
			maxNativeZoom: 20
		});

		var roadlayer = L.tileLayer('https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?style=silkysand&layers=transport,labels&apiKey={apiKey}', {
			style: style,
			apiKey: apiKey,
			maxZoom: 22
		});
		return L.layerGroup([satlayer, roadlayer]);
	}
	else {
		var bg = L.tileLayer('https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?style={style}&apiKey={apiKey}', {
			style: style,
			apiKey: apiKey,
			maxZoom: 22
		});

		return L.layerGroup([bg]);
	}
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
				apiKey: apiKey
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
			apiKey: apiKey,
			profile: routingProfile,
			trafficMode: realisticTraffic? 'REALISTIC' : 'AVERAGE'
		}),
		collapsible: true,
		routeWhileDragging: false,
		routeDragInterval: 1000,
		formatter: new L.Routing.Formatter({
			roundingSensitivity: 1000
		})
	}).addTo(map);

	routingControl.on('routingerror', function (e) { });

	L.Routing.errorControl(routingControl).addTo(map);
};

// update ui
$('#scenarioSelect').val(scenario);

var sidebar = L.control.sidebar('sidebar').addTo(map);
sidebar.open('home');

// add scale control
L.control.scale().addTo(map);

var baseLayers = {
	'PTV satellite': getXMapBaseLayers('satellite'),
	'PTV gravelpit': getXMapBaseLayers('gravelpit'),
	'PTV sandbox': getXMapBaseLayers('sandbox'),
	'PTV silkysand': getXMapBaseLayers('silkysand').addTo(map),
	'PTV classic': getXMapBaseLayers('classic'),
	'PTV blackmarble': getXMapBaseLayers('blackmarble'),
	'PTV silica': getXMapBaseLayers('silica')
};

L.control.layers(baseLayers, {}, {
	position: 'bottomleft',
	autoZIndex: false
}).addTo(map);

var _onMapLoad = function (e) {
	// Load cache
	var sel = document.getElementById('vehicleType');
	for (var i = 0, iLen = sel.options.length; i < iLen; i++) {
		optionsCache.push(sel.options[i]);
	}

	filterItems("EUR_")

	initializeRoutingControl();
};

map.on('load', _onMapLoad, this);
map.setView([0, 0], 1);

function filterItems(prefix) {
	var sel = document.getElementById('vehicleType');
	
	restoreOptions();

	// Loop backwards through options as removing them modifies the next
	// to be visited if go forwards
	for (var i = sel.options.length - 1; i >= 0; i--) {
		opt = sel.options[i];
		if (opt.text.indexOf(prefix) == -1) {
			sel.removeChild(opt)
		}
	}

	sel.options[0].selected = "selected";
}

// Restore select to original state
function restoreOptions() {
	var sel = document.getElementById('vehicleType');
	sel.options.length = 0;
	for (var i = 0, iLen = optionsCache.length; i < iLen; i++) {
		sel.appendChild(optionsCache[i]);
	}
}

// update the map scenario
var updateScenario = function () {
	scenario = $('#scenarioSelect option:selected').val();

	filterItems(scenario + "_");

	updateParams(true);
};

// update the routing params
var updateParams = function (updateWayPoints) {
	routingProfile = $('#vehicleType').val();
	useImperial = $('#useImperial').is(':checked');
	realisticTraffic = $('#realisticTraffic').is(':checked');

	if (updateWayPoints) {
		routingControl.setWaypoints(getPlan());
	}

	routingControl._router.options.profile = routingProfile;
	routingControl._router.options.trafficMode = realisticTraffic? 'REALISTIC' : 'AVERAGE';
	routingControl._formatter.options.units = useImperial ? 'imperial' : 'metric';
	routingControl.route();
};
