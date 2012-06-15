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
	
	all: function(type, collection, callback, store) {
		var collectionName = this.getCollectionName(type);
		var objects = this.fetchMany(collectionName, this.keys(collectionName));
		callback.call(store, type, collection, objects);
		return collection;
	},
	
	findById: function(type, object, id, callback, store) {
		var collectionName = this.getCollectionName(type);
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
	
	add: function(type, json, successCallbacks, errorCallbacks) {
		var collectionName = this.getCollectionName(type);
		var keys = this.keys(collectionName);
		var objectKey = guid();
		keys.push(objectKey);
		this.persistKeys(collectionName, keys);
		this.persistObject(collectionName, objectKey, json);
        json['id'] = objectKey;
        this.executeCallbacks(successCallbacks, json);
	},
	
	update: function(type, json, successCallbacks, errorCallbacks) {
		var collectionName = this.getCollectionName(type);
        var objectKey = json[type.getPk()];
		// TODO : check key existence ?
		this.persistObject(collectionName, objectKey, json);
        this.executeCallbacks(successCallbacks, json);
	},
	
	destroy: function(type, object, callback, store) {
		var collectionName = this.getCollectionName(type);
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
