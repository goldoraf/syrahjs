Syrah.RESTApiDataSource = Syrah.DataSource.extend({
	
	baseUrl: '',
    urlEncodeData: false,
	
	all: function(type, collection, callback, store) {
		this.ajax(type, this.buildUrl(type), 'GET', {
			success: function(json) {
				callback.call(store, type, collection, json);
			}
		});
	},

    find: function(type, collection, query, callback, store) {
        this.ajax(type, this.buildUrl(type), 'GET', {
            data: query,
            success: function(json) {
                callback.call(store, type, collection, json);
            }
        });
    },
	
	findById: function(type, object, id, callback, store) {
		this.ajax(type, this.buildUrl(type) + '/' + id, 'GET', {
			success: function(json) {
				callback.call(store, object, json);
			}
		});
	},
	
	add: function(type, json, successCallbacks, errorCallbacks) {
		this.ajax(type, this.buildUrl(type), 'POST', {
			data: this.encodePayload(type, json)
		}, successCallbacks, errorCallbacks);
	},

    addInBulk: function(type, json, successCallbacks, errorCallbacks) {
        this.ajax(type, this.buildUrl(type) + '/bulk', 'POST', {
            data: this.encodeBulkPayload(type, json)
        }, successCallbacks, errorCallbacks);
    },
	
	update: function(type, json, successCallbacks, errorCallbacks) {
		var id = json[type.getPk()];
		this.ajax(type, this.buildUrl(type) + '/' + id, 'PUT', {
			data: this.encodePayload(type, json)
		}, successCallbacks, errorCallbacks);
	},

    updateInBulk: function(type, json, successCallbacks, errorCallbacks) {
        this.ajax(type, this.buildUrl(type) + '/bulk', 'PUT', {
            data: this.encodeBulkPayload(type, json)
        }, successCallbacks, errorCallbacks);
    },
	
	destroy: function(type, json, successCallbacks, errorCallbacks) {
        var id = json[type.getPk()];
		this.ajax(type, this.buildUrl(type) + '/' + id, 'DELETE', {}, successCallbacks, errorCallbacks);
	},

    destroyInBulk: function(type, json, successCallbacks, errorCallbacks) {
        this.ajax(type, this.buildUrl(type) + '/bulk', 'DELETE', {
            data: this.encodeBulkPayload(type, json)
        }, successCallbacks, errorCallbacks);
    },
	
	ajax: function(type, url, method, options, successCallbacks, errorCallbacks) {
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
                    this.executeCallbacks(successCallbacks, this.parseResponseData(json, type));
                } else {
                    this.executeCallbacks(errorCallbacks, {}, this.parseErrorResponse(xhr.responseText), xhr); // TODO : pass a real exception
                }
            };
        }
        if (options.error === undefined && errorCallbacks !== undefined) {
            options.error = function(xhr, textStatus, errorThrown) {
                this.executeCallbacks(errorCallbacks, errorThrown, this.parseErrorResponse(xhr.responseText), xhr);
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

    encodePayload: function(type, json, index, prefix) {
        if (this.get('urlEncodeData') !== false) {
            var parts = [];

            if (prefix !== undefined) prefix += '.';
            else prefix = '';
            prefix += Syrah.Inflector.getTypeName(type);

            if (index !== undefined) prefix+= '[' + index + ']';
            for (var k in json) {
                if (Ember.typeOf(json[k]) === 'array') {
                    parts.push(this.encodeBulkPayload(k, json[k], prefix));
                } else if (Ember.typeOf(json[k]) === 'object') {
                    parts.push(this.encodePayload(k, json[k], undefined, prefix));
                } else {
                    var value = json[k] === null ? '' : encodeURIComponent(json[k]);
                    parts.push(prefix + '.' + k + '=' + value);
                }
            }
            return parts.join('&');
        }
        return json;
    },

    encodeBulkPayload: function(type, json, prefix) {
        if (this.get('urlEncodeData') !== false) {
            var parts = [];
            json.forEach(function(item, index) {
                if (Ember.typeOf(item) !== 'instance' && Ember.typeOf(item) !== 'object') {
                    // it should be IDs for a DELETE then...
                    parts.push(type.getPk() + '[' + index + ']=' + item);
                } else {
                    if (prefix !== undefined) {
                        parts.push(prefix + '.' + this.encodePayload(type, item, index));
                    } else {
                        parts.push(this.encodePayload(type, item, index));
                    }
                }
            }, this);
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

    parseResponseData: function(json, type) {
        return json;
    },

    parseErrorResponse: function(responseText) {
        return JSON.parse(responseText);
    }
});
