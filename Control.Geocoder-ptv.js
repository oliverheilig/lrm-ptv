if(!L.Control.Geocoder) {L.Control.Geocoder = {};}

L.Control.Geocoder.Ptv = L.Class.extend({
	options: {
		// api url
		serviceUrl: '',

		// api key
		apiKey: ''
	},

	initialize: function (options) {
		L.Util.setOptions(this, options);
	},

	runGetRequest: function (url, request, apiKey, handleSuccess, handleError) {
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

	// using standard xLocate geocoding as suggest/autocompletion
	suggest: function(query, cb, context) {
		return this.geocode(query, cb, context);
	},
	
	geocode: function (query, cb, context) {
		var request = `/geocoding/v1/locations/by-text?searchText=${encodeURIComponent(query)}`
		this.runGetRequest(this.options.serviceUrl, request, this.options.apiKey,
			L.bind(function (response) {
				// temporary fix api doesn't return proper response heeader
				var results = [];
				if (!response.locations || response.locations.length === 0)
				{return;}
				for (var i = response.locations.length - 1; i >= 0; i--) {
					var resultAddress = response.locations[i];
					var loc = L.latLng(resultAddress.referencePosition.latitude, resultAddress.referencePosition.longitude);
					results[i] = {
						name: resultAddress.formattedAddress,
						center: loc,
						bbox: L.latLngBounds(loc, loc)
					};
				}
				cb.call(context, results);
			}, this),

			function (xhr) {
				console.log(xhr);
			}
		);
	},

	reverse: function (location, scale, cb, context) {
		var request = `/geocoding/v1/locations/by-position/${location.lat}/${location.lng}`;

		this.runGetRequest(this.options.serviceUrl, request, this.options.apiKey,
			L.bind(function (response) {
				if (!response.locations || response.locations.length === 0)
				{return;}

				var resultAddress = response.locations[0];
				var loc = L.latLng(resultAddress.referencePosition.latitude, resultAddress.referencePosition.longitude);
				cb.call(context, [{
					name: resultAddress.formattedAddress,
					center: loc,
					bounds: L.latLngBounds(loc, loc)
				}]);
			}, this),

			function (xhr) {
				console.log(xhr);
			}
		);
	}
});

L.Control.Geocoder.ptv = function (options) {
	return new L.Control.Geocoder.Ptv(options);
};