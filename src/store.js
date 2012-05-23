Syrah.Store = Ember.Object.extend({
	
	ds: null,
	marshaller: Syrah.JSONMarshaller.create(),
	
	init: function() {
		
	},
	
	add: function(object) {
		this.get('ds').add(object, this.didAddObject, this);
		return object;
	},
	
	update: function(object) {
		this.get('ds').update(object, this.didUpdateObject, this);
		return object;
	},
	
	destroy: function(object) {
		this.get('ds').destroy(object, this.didDestroyObject, this);
		return;
	},
	
	find: function(type, query) {
		if (query === undefined) {
			return this.all(type);
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
	
	didAddObject: function(object, id, hash) {
		// If the DS has not provided an ID, it must be provided in the returned hash
		if (id === null) {
			var pk = (object.get('primaryKey') !== undefined) ? object.get('primaryKey') : 'id';
			if (hash[pk] === undefined) {
				throw "The DataSource has not provided an ID for the newly created object";
			}
			id = hash[pk];
		}
		object.set('id', id);
		return object;
	},
	
	didUpdateObject: function(object, hash) {
		
	},
	
	didDestroyObject: function(object) {
		object.destroy();
	},
	
	toJSON: function(object) {
		return this.get('marshaller').marshall(object);
	}
});
