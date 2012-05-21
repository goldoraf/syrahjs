Inativ.Store = Ember.Object.extend({
	
	ds: null,
	
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
	
	find: function(type, query) {
		if (query === undefined) {
			return this.all(type);
		}
	},
	
	findById: function(type, id) {
		var object = type.create();
		this.get('ds').findById(object, id, this.load, this);
		return object;
	},
	
	all: function(type) {
		var collection = this.createCollection(type);
		this.get('ds').all(collection, this.loadMany, this);
		return collection;
	},
	
	loadMany: function(collection, data) {
		var type = collection.get('type');
		var objects = [];
		data.forEach(function(hash) {
			objects.push(type.create(hash));
		});
		collection.pushObjects(objects);
		return collection;
	},
	
	load: function(object, hash) {
		object.beginPropertyChanges();
		object.setProperties(hash);
		object.endPropertyChanges();
		return object;
	},
	
	didAddObject: function(object, id, hash) {
		object.set('id', id);
		return object;
	},
	
	didUpdateObject: function(object, hash) {
		
	},
	
	toJSON: function(object) {
		var v, attrs = [];
        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                v = this[prop];
                if (v === 'toString') {
                    continue;
                }
                if (Ember.typeOf(v) === 'function') {
                    continue;
                }
                attrs.push(prop);
            }
        }
        return object.getProperties(attrs);
	},
	
	createCollection: function(type) {
		return Inativ.Collection.create({ 
			type: type, 
			content: Ember.A([]), 
			store: this
		});
	},
	
	getCollectionName: function(type) {
		return this.pluralize(this.getTypeName(type));
	},
	
	getTypeName: function(type) {
		var parts = type.toString().split(".");
	    var name = parts[parts.length - 1];
	    return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
	},
	
	pluralize: function(singular) {
		return singular + 's';
	}
});
