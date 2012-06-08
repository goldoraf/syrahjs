Syrah.RESTApiDataSource = Syrah.DataSource.extend({
	
	baseUrl: '',
    urlEncodeData: false,
	
	all: function(type, collection, callback, store) {
		this.ajax(this.buildUrl(store, type), 'GET', {
			success: function(json) {
				callback.call(store, type, collection, json);
			}
		});
	},

    find: function(type, collection, query, callback, store) {
        this.ajax(this.buildUrl(store, type), 'GET', {
            data: query,
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
			data: this.buildPayload(store, object),
			success: function(json) {
				callback.call(store, object, null, json);
			}
		});
	},
	
	update: function(object, callback, store) {
		var id = object.get('id');
		this.ajax(this.buildUrl(store, object.constructor) + '/' + id, 'PUT', {
			data: this.buildPayload(store, object),
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
		options.contentType = this.get('urlEncodeData') === false ? 'application/json; charset=utf-8'
                                                                  : 'application/x-www-form-urlencoded; charset=UTF-8';
		options.context = this;

		if (options.data && options.type !== 'GET' && this.get('urlEncodeData') === false) {
			options.data = JSON.stringify(options.data);
	    }

		jQuery.ajax(options);
	},

    buildPayload: function(store, object) {
        if (this.get('urlEncodeData') !== false) {
            var json = store.toJSON(object);
            var parts = [];
            var prefix = Syrah.Inflector.getTypeName(object.constructor);
            for (var k in json) {
                parts.push(prefix + '.' + k + '=' + encodeURIComponent(json[k]));
            }
            return parts.join('&');
        }
        return store.toJSON(object);
    },
	
	buildUrl: function(store, type) {
		return this.get('baseUrl') + '/' + this.getCollectionName(store, type);
	}
});
