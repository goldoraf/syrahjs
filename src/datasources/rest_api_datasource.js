Syrah.RESTApiDataSource = Syrah.DataSource.extend({
	
	baseUrl: '',
	
	all: function(type, collection, callback, store) {
		this.ajax(this.buildUrl(store, type), 'GET', {
			success: function(json) {
				callback.call(store, type, collection, json);
			}
		});
	},
	
	findById: function(type, object, id, callback, store) {
		this.ajax(this.buildUrl(store, type) + '/' + id, 'GET', {
			success: function(json) {
				callback.call(store, object, json);
			}
		});
	},
	
	add: function(object, callback, store) {
		this.ajax(this.buildUrl(store, object.constructor), 'POST', {
			data: store.toJSON(object),
			success: function(json) {
				callback.call(store, object, null, json);
			}
		});
	},
	
	update: function(object, callback, store) {
		var id = object.get('id');
		this.ajax(this.buildUrl(store, object.constructor) + '/' + id, 'PUT', {
			data: store.toJSON(object),
			success: function(json) {
				callback.call(store, object, json);
			}
		});
	},
	
	destroy: function(object, callback, store) {
		var id = object.get('id');
		this.ajax(this.buildUrl(store, object.constructor) + '/' + id, 'DELETE', {
			success: function(json) {
				callback.call(store, object);
			}
		});
	},
	
	ajax: function(url, method, options) {
		options.url = url,
		options.type = method,
		options.dataType = 'json';
		options.contentType = 'application/json; charset=utf-8';
		options.context = this;
		
		if (options.data && options.type !== 'GET') {
			options.data = JSON.stringify(options.data);
	    }
		
		jQuery.ajax(options);
	},
	
	buildUrl: function(store, type) {
		return this.get('baseUrl') + '/' + this.getCollectionName(store, type);
	}
});
