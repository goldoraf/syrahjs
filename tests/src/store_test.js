module('Store tests', {
	setup: function() {
		window.Foo = Ember.Namespace.create();
		Foo.BarTest = Ember.Object.extend();
		Foo.Contact = Ember.Object.extend({
			firstname: null,
			lastname: null,
		});
	}
});


test("Store has a getTypeName() method to get a type's name in underscored lowercase", function() {
	var store = Syrah.Store.create();
	
	equal(store.getTypeName(Foo.BarTest), 'bar_test');
});

test("Store has a getCollectionName() method to get a pluralized type's name", function() {
	var store = Syrah.Store.create();
	
	equal(store.getCollectionName(Foo.BarTest), 'bar_tests');
});

test("Store has a createCollection() method to get a collection for a given type", function() {
	var store = Syrah.Store.create();
	var coll = store.createCollection(Foo.BarTest);
	
	ok(coll instanceof Syrah.Collection);
	equal(coll.get('store'), store);
	equal(coll.get('type'), Foo.BarTest);
});

test("Store has a load() method to load in attributes in an object", function() {
	var store = Syrah.Store.create();
	var contact = Foo.Contact.create();
	store.load(contact, { firstname: 'John', lastname: 'Doe' });
	
	equal(contact.get('firstname'), 'John');
	equal(contact.get('lastname'), 'Doe');
});

test("Calling Store.findById() should invoke his datasource's findById() and return an object", function() {
	var ds = Syrah.DataSource.create({
		findById: function(object, id, callback, store) {
			ok(true, "DataSource.findById() was called");
			equal(store, currentStore, "DataSource.findById() was called with the right store");
			
			var loadedObject = callback.call(store, object, { firstname: 'John', lastname: 'Doe' });
			equal(loadedObject.get('firstname'), 'John', "DataSource.findById() was called with a callback to Store.load()");
		}
	});
	
	var currentStore = Syrah.Store.create({ ds: ds });
	var returnedObject = currentStore.findById(Foo.Contact, 1);
	
	ok(returnedObject instanceof Foo.Contact, "Store.findById() returned an object");
});

test("Store has a loadMany() method to load in a collection of objects", function() {
	var store = Syrah.Store.create();
	var coll = store.createCollection(Foo.Contact);
	store.loadMany(coll, [
	    { firstname: 'John', lastname: 'Doe' },
	    { firstname: 'Jane', lastname: 'Doe' }
	]);
	
	//equal(coll.length, 2);
	equal(coll.objectAt(0).get('firstname'), 'John');
	equal(coll.objectAt(1).get('firstname'), 'Jane');
});

test("Calling Store.all() should invoke his datasource's all() and return a collection", function() {
	var ds = Syrah.DataSource.create({
		all: function(collection, callback, store) {
			ok(true, "DataSource.all() was called");
			equal(store, currentStore, "DataSource.all() was called with the right store");
			
			var loadedColl = callback.call(store, collection, [
                { firstname: 'John', lastname: 'Doe' },
	            { firstname: 'Jane', lastname: 'Doe' }
	        ]);
			equal(loadedColl.objectAt(0).get('firstname'), 'John');
			equal(loadedColl.objectAt(1).get('firstname'), 'Jane');
		}
	});
	
	var currentStore = Syrah.Store.create({ ds: ds });
	var returnedCollection = currentStore.all(Foo.Contact);
	
	ok(returnedCollection instanceof Syrah.Collection, "Store.all() returned a collection");
});

test("Store has a toJSON() method to retrieve an object's attributes' values", function() {
	var store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	deepEqual(store.toJSON(contact), { firstname: 'John', lastname: 'Doe' });
});

test("Calling Store.add() should invoke his datasource's add()", function() {
	var ds = Syrah.DataSource.create({
		add: function(object, callback, store) {
			ok(true, "DataSource.add() was called");
			equal(store, currentStore, "DataSource.add() was called with the right store");
			callback.call(store, object, '123');
		}
	});
	
	var currentStore = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didAddObject: function(object, id, hash) {
			ok(true, "Store callback didAddObject() was called");
			equal(id, '123', "Store callback didAddObject() was passed an ID");
		} 
	});
	
	currentStore.add(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }));
});

test("Store has a didAddObject() callback that sets the object's id", function() {
	var store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	store.didAddObject(contact, 12345, {});
	equal(contact.get('id'), 12345);
});

test("Store has a didAddObject() callback that sets the object's id when provided in the hash", function() {
	var store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	store.didAddObject(contact, null, { id: 12345 });
	equal(contact.get('id'), 12345);
});

test("Calling Store.update() should invoke his datasource's update()", function() {
	var ds = Syrah.DataSource.create({
		update: function(object, callback, store) {
			ok(true, "DataSource.update() was called");
			equal(store, currentStore, "DataSource.update() was called with the right store");
			callback.call(store, object);
		}
	});
	
	var currentStore = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didUpdateObject: function(object, hash) {
			ok(true, "Store callback didUpdateObject() was called");
		} 
	});
	
	var obj = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	currentStore.update(obj);
});

test("Calling Store.destroy() should invoke his datasource's destroy()", function() {
	var ds = Syrah.DataSource.create({
		destroy: function(object, callback, store) {
			ok(true, "DataSource.destroy() was called");
			equal(store, currentStore, "DataSource.destroy() was called with the right store");
			callback.call(store, object);
		}
	});
	
	var currentStore = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didDestroyObject: function(object) {
			ok(true, "Store callback didDestroyObject() was called");
		} 
	});
	
	var obj = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	currentStore.destroy(obj);
});

test("Store has a didDestroyObject() that destroys the object", function() {
	var store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	store.didDestroyObject(contact);
	ok(contact.isDestroyed == true, "The object has been destroyed");
});
