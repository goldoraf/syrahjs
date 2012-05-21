Inativ.RESTApiDataSource = Inativ.DataSource.extend({
	
	all: function(collection, callback, store) {
		this.ajax(this.buildUrl(store, collection), 'GET', {
			success: function(json) {
				callback.call(store, collection, json);
			}
		});
	},
	
	findById: function(object, id, callback, store) {
		this.ajax(this.buildUrl(store, object) + '/' + id, 'GET', {
			success: function(json) {
				callback.call(store, object, json);
			}
		});
	},
	
	add: function(object, callback, store) {
		this.ajax(this.buildUrl(store, object), 'POST', {
			data: store.toJSON(object),
			success: function(json) {
				callback.call(store, object, null, json);
			}
		});
	},
	
	ajax: function(url, method, options) {
		options.url = url,
		options.type = method,
		options.dataType = 'json';
		options.contentType = 'application/json; charset=utf-8';
		options.context = this;
		
		if (options.data && type !== 'GET') {
			options.data = JSON.stringify(options.data);
	    }
		
		jQuery.ajax(options);
	},
	
	buildUrl: function(store, object) {
		return '/' + this.getCollectionName(store, object);
	}
});
