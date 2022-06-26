L.Routing.Ptv = L.Class.extend({
	options: {
		// api url
		serviceUrl: '',

		// delegate to manipulate the request before send
		beforeSend: null,

		// api key
		apiKey: ''
	},

	initialize: function (options) {
		L.Util.setOptions(this, options);
	},

	runRequest: function (url, request, apiKey, handleSuccess, handleError) {
		$.ajax({
			url: url + request,
			type: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'ApiKey': apiKey
			},

			success: function (data, status, xhr) {
				handleSuccess(data);
			},

			error: function (xhr, status, error) {
				handleError(xhr);
			}
		});
	},

	route: function (waypoints, callback, context, options) {
		var url = this.options.serviceUrl;

		var request = this._buildRouteRequest(waypoints, options);

		var geometryOnly = options && options.geometryOnly;

		var numAlts = geometryOnly ? 0 : this.options.numberOfAlternatives;

		this.runRequest(url, request, this.options.apiKey,
			L.bind(function (response) {
				this._routeDone(response, waypoints, callback, context);
			}, this),

			function (xhr) {
				xhr.message = xhr.responseText;
				callback.call(context, xhr, null);
			}
		);
	},

	_routeDone: function (response, inputWaypoints, callback, context) {
		var alts = [];

		var coordinates = this._buildLinestring(JSON.parse(response.polyline).coordinates);
		alts.push({
			name: 'Route',
			coordinates: coordinates,
			summary: this._convertSummary(response),
			inputWaypoints: inputWaypoints,
			waypoints: inputWaypoints,
			instructions: []
		});

		callback.call(context, null, alts);
	},


	_buildLinestring: function (inputpoints) {
		var points = [];

		for (var i = 0; i < inputpoints.length; i++) {
			points.push([inputpoints[i][1], inputpoints[i][0]]);
		}

		return points;
	},

	_convertSummary: function (response) {
		return {
			totalDistance: response.distance,
			totalTime: response.travelTime
		};
	},

	_buildRouteRequest: function (waypoints, options) {
		var request = 'routing/v1/routes?results=POLYLINE&profile=EUR_CAR';

		var wpCoords = [];
		for (i = 0; i < waypoints.length; i++) {
			request = request + `&waypoints=${waypoints[i].latLng.lat},${waypoints[i].latLng.lng}`
			wpCoords.push({
				'$type': 'OffRoadWaypoint',
				'location': {
					'offRoadCoordinate': {
						'x': waypoints[i].latLng.lng,
						'y': waypoints[i].latLng.lat
					}
				}
			});
		}

		var geometryOnly = options && options.geometryOnly;

		var numAlts = geometryOnly ? 0 : this.options.numberOfAlternatives;

		if (typeof this.options.beforeSend === 'function') {
			request = this.options.beforeSend(request);
		}

		return request;
	}
});

L.Routing.ptv = function (options) {
	return new L.Routing.Ptv(options);
};