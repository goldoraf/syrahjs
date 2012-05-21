//Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

Inativ.LocalStorageDataSource = Inativ.DataSource.extend({
	
	name: null,
	storage: localStorage,
	collectionsKeys: {},
	
	init: function() {
		this._super();
		var store = this.get('storage').getItem(this.get('name'));
		
	},
	
	keys: function(collectionName) {
		var collKeys = this.get('collectionsKeys');
		if (!collKeys.hasOwnProperty(collectionName)) {
			var keys = this.get('storage').getItem(this.get('name') + ':' + collectionName).split(',');
			collKeys[collectionName] = keys;
		}
		return collKeys[collectionName];
	},
	
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
		this.get('storage').setItem(this.get('name') + ':' + collectionName, keys.join(','));
		
		var data = store.toJSON(object);
		this.get('storage').setItem(this.get('name') + ':' + collectionName + ':' + objectKey, JSON.stringify(data));
		callback.call(store, object, objectKey, data);
	}
	
});
