Syrah.RESTApiDataSource = Syrah.DataSource.extend({
	
	baseUrl: '',
    urlEncodeData: false,
	
	all: function(type, collection, callback, store) {
		this.ajax(this.buildUrl(type), 'GET', {
			success: function(json) {
				callback.call(store, type, collection, json);
			}
		});
	},

    find: function(type, collection, query, callback, store) {
        this.ajax(this.buildUrl(type), 'GET', {
            data: query,
            success: function(json) {
                callback.call(store, type, collection, json);
            }
        });
    },
	
	findById: function(type, object, id, callback, store) {
		this.ajax(this.buildUrl(type) + '/' + id, 'GET', {
			success: function(json) {
				callback.call(store, object, json);
			}
		});
	},
	
	add: function(type, json, successCallbacks, errorCallbacks) {
		this.ajax(this.buildUrl(type), 'POST', {
			data: this.encodePayload(type, json)
		}, successCallbacks, errorCallbacks);
	},
	
	update: function(type, json, successCallbacks, errorCallbacks) {
		var id = json[type.getPk()];
		this.ajax(this.buildUrl(type) + '/' + id, 'PUT', {
			data: this.encodePayload(type, json)
		}, successCallbacks, errorCallbacks);
	},
	
	destroy: function(type, json, successCallbacks, errorCallbacks) {
        var id = json[type.getPk()];
		this.ajax(this.buildUrl(type) + '/' + id, 'DELETE', {}, successCallbacks, errorCallbacks);
	},
	
	ajax: function(url, method, options, successCallbacks, errorCallbacks) {
		options.url = url,
		options.type = method,
		options.dataType = 'json';
		options.contentType = this.get('urlEncodeData') === false ? 'application/json; charset=utf-8'
                                                                  : 'application/x-www-form-urlencoded; charset=UTF-8';
		options.context = this;

		if (options.data && options.type !== 'GET' && this.get('urlEncodeData') === false) {
			options.data = JSON.stringify(options.data);
	    }

        if (options.success === undefined && successCallbacks !== undefined) {
            options.success = function(json, textStatus, xhr) {
                if (this.isRequestSuccessful(json, textStatus, xhr)) {
                    this.executeCallbacks(successCallbacks, this.parseResponseData(json));
                } else {
                    this.executeCallbacks(errorCallbacks, {}, this.parseErrorResponse(xhr.responseText), xhr); // TODO : pass a real exception
                }
            };
        }
        if (options.error === undefined && errorCallbacks !== undefined) {
            options.error = function(xhr, textStatus, errorThrown) {
                this.executeCallbacks(errorCallbacks, errorThrown, xhr);
            };
        }

		jQuery.ajax(options);
	},

    buildPayload: function(store, object) {
        if (this.get('urlEncodeData') !== false) {
            var json = store.toJSON(object);
            var parts = [];
            var prefix = Syrah.Inflector.getTypeName(object.constructor);
            for (var k in json) {
                var value = json[k] === null ? '' : encodeURIComponent(json[k]);
                parts.push(prefix + '.' + k + '=' + value);
            }
            return parts.join('&');
        }
        return store.toJSON(object);
    },

    encodePayload: function(type, json) {
        if (this.get('urlEncodeData') !== false) {
            var parts = [];
            var prefix = Syrah.Inflector.getTypeName(type);
            for (var k in json) {
                var value = json[k] === null ? '' : encodeURIComponent(json[k]);
                parts.push(prefix + '.' + k + '=' + value);
            }
            return parts.join('&');
        }
        return json;
    },
	
	buildUrl: function(type) {
		return this.get('baseUrl') + '/' + this.getCollectionName(type);
	},

    isRequestSuccessful: function(json, textStatus, xhr) {
        return true;
    },

    parseResponseData: function(json) {
        return json;
    },

    parseErrorResponse: function(responseText) {
        return JSON.parse(responseText);
    }
});
