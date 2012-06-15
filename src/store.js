Syrah.Store = Ember.Object.extend({
	
	ds: null,
	marshaller: Syrah.JSONMarshaller.create(),
	
	add: function(object, options) {
		options = options || {};
        var successCallbacks = [];
        successCallbacks.push([this.didAddObject, this, object]);
        if (options.success !== undefined && options.success instanceof Array) {
            successCallbacks.push(options.success);
        }
        var errorCallbacks = [];
        errorCallbacks.push([this.didError, this, object]);
        if (options.error !== undefined && options.error instanceof Array) {
            errorCallbacks.push(options.error);
        }
        this.get('ds').add(object.constructor, this.toJSON(object), successCallbacks, errorCallbacks);
		return object;
	},
	
	update: function(object) {
		this.get('ds').update(object.constructor, object, this.didUpdateObject, this);
		return object;
	},
	
	destroy: function(object) {
		this.get('ds').destroy(object.constructor, object, this.didDestroyObject, this);
		return;
	},
	
	find: function(type, query) {
		if (query === undefined) {
			return this.all(type);
		} else {
            var collection = Ember.A([]);
            this.get('ds').find(type, collection, query, this.loadMany, this);
            return collection;
        }
	},
	
	findById: function(type, id) {
		var object = type.create();
		this.get('ds').findById(type, object, id, this.load, this);
		return object;
	},
	
	all: function(type) {
		var collection = Ember.A([]);
		this.get('ds').all(type, collection, this.loadMany, this);
		return collection;
	},
	
	loadMany: function(type, collection, data) {
		var objects = [];
		data.forEach(function(hash) {
			objects.push(this.load(type.create(), hash));
		}, this);
		collection.pushObjects(objects);
		return collection;
	},
	
	load: function(object, json) {
		return this.get('marshaller').unmarshall(json, object);
	},
	
	didAddObject: function(object, json) {
		// The DS must provide an ID for the newly created object in the returned JSON
        var pk = object.hasOwnProperty('getPrimaryKey') ? object.getPrimaryKey() : 'id';
        if (json[pk] === undefined) {
            throw "The DataSource has not provided an ID for the newly created object";
        }
        id = json[pk];
		object.set('id', id);
		return object;
	},
	
	didUpdateObject: function(object, hash) {
		
	},
	
	didDestroyObject: function(object) {
		object.destroy();
	},

    didError: function(object, error) {
        // TODO : do something smart here...
    },
	
	toJSON: function(object) {
		return this.get('marshaller').marshall(object);
	}
});
