//Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

Syrah.LocalStorageDataSource = Syrah.DataSource.extend({
	
	name: null,
	storage: localStorage,
	
	all: function(collection, callback, store) {
		var collectionName = this.getCollectionName(store, collection);
		var objects = this.fetchMany(collectionName, this.keys(collectionName));
		callback.call(store, collection, objects);
		return collection;
	},
	
	findById: function(object, id, callback, store) {
		var collectionName = this.getCollectionName(store, object);
		var data = this.fetch(collectionName, id);
		callback.call(store, object, data);
		return object;
	},
	
	fetch: function(collectionName, key) {
		var json = this.get('storage').getItem(this.get('name') + ':' + collectionName + ':' + key);
		return JSON.parse(json);
	},
	
	fetchMany: function(collectionName, keys) {
		var objects = [];
		keys.forEach(function(key) {
			objects.push(this.fetch(collectionName, key));
		}, this);
		return objects;
	},
	
	add: function(object, callback, store) {
		var collectionName = this.getCollectionName(store, object);
		var keys = this.keys(collectionName);
		var objectKey = guid();
		keys.push(objectKey);
		this.persistKeys(collectionName, keys);
		
		var data = store.toJSON(object);
		this.persistObject(collectionName, objectKey, data);
		callback.call(store, object, objectKey, data);
	},
	
	update: function(object, callback, store) {
		var collectionName = this.getCollectionName(store, object);
		var objectKey = object.get('id');
		// TODO : check key existence ?
		var data = store.toJSON(object);
		this.persistObject(collectionName, objectKey, data);
		callback.call(store, object, data);
	},
	
	destroy: function(object, callback, store) {
		var collectionName = this.getCollectionName(store, object);
		var keys = this.keys(collectionName);
		var objectKey = object.get('id');
		keys.removeAt(keys.indexOf(objectKey));
		this.persistKeys(collectionName, keys);
		
		this.get('storage').removeItem(this.get('name') + ':' + collectionName + ':' + objectKey);
		callback.call(store, object);
	},
	
	persistObject: function(collectionName, objectKey, data) {
		this.get('storage').setItem(this.get('name') + ':' + collectionName + ':' + objectKey, JSON.stringify(data));
	},
	
	keys: function(collectionName) {
		return this.get('storage').getItem(this.get('name') + ':' + collectionName).split(',');
	},
	
	persistKeys: function(collectionName, keys) {
		this.get('storage').setItem(this.get('name') + ':' + collectionName, keys.join(','));
	}
	
});
