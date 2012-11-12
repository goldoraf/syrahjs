module('Store tests', {
	setup: function() {
		window.Foo = Ember.Namespace.create();
        Foo.Addressbook = Syrah.Model.define({
            name: String,
            contacts: {
                type: Syrah.HasMany,
                itemType: "Foo.Contact"
            }
        });
        Foo.Contact = Syrah.Model.define({
            firstname: String,
            lastname: String,
            addressbook: {
                type: "Foo.Addressbook"
            },
            phones: {
                type: Syrah.HasMany,
                itemType: "Foo.Phone"
            }
        });
        Foo.Phone = Syrah.Model.define({
            number: String,
            type: String
        });
	}
});

test("Store has a load() method to load in attributes in an object", function() {
	var store = Foo.store = Syrah.Store.create({ds: Syrah.IdentityDataSource.create()});
	var contact = Foo.Contact.create();

    equal(contact.get("isLoaded"), false, "When a new Syrah object is created, its isLoaded property is set to false");

	store.load(contact, { firstname: 'John', lastname: 'Doe' });

    equal(contact.get("isLoaded"), true, "isLoaded is true once the store loaded the object");
    equal(contact.get('phones').get("isLoaded"), false,
        "A HasMany association not included in the JSON has a isLoaded property set to false");
    equal(contact.get('addressbook').get("isLoaded"), false,
        "A BelongsTo association not included in the JSON has a isLoaded property set to false");

	equal(contact.get('firstname'), 'John');
	equal(contact.get('lastname'), 'Doe');
});

test("The store load() method works with a graph of objects", function() {
    var store = Foo.store = Syrah.Store.create();
    var contact = Foo.Contact.create();

    store.load(contact, {
        firstname: 'John',
        lastname: 'Doe',
        phones: [{ number: "+87654321", type: "mobile" }]
    });

    equal(contact.get('phones').get("isLoaded"), true,
        "A HasMany association included in the JSON has a isLoaded property set to true");

    equal(contact.get('phones').get('length'), 1);
    equal(contact.get('phones').objectAt(0).get('number'), "+87654321");
    equal(contact.get('phones').objectAt(0).get('type'), "mobile");

});

test("Store has a newCollection() method that returns an array with a isLoaded property set to false", function() {
    var store = Foo.store = Syrah.Store.create();
    var coll = store.newCollection();
    equal(coll.get('isLoaded'), false);
});

test("Calling Store.findById() should invoke his datasource's findById() and return an object", function() {
	var ds = Syrah.DataSource.create({
		findById: function(type, object, id, callback, store) {
			ok(true, "DataSource.findById() was called");
			equal(store, currentStore, "DataSource.findById() was called with the right store");
			
			var loadedObject = callback.call(store, object, {id: 1, firstname: 'John', lastname: 'Doe' });
			equal(loadedObject.get('firstname'), 'John', "DataSource.findById() was called with a callback to Store.load()");
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	var returnedObject = currentStore.findById(Foo.Contact, 1);
	
	ok(returnedObject instanceof Foo.Contact, "Store.findById() returned an object");
    ok(returnedObject === currentStore.findById(Foo.Contact, 1), "Store.findById() returns the cached object if it exists");
});

asyncTest("Associations are fetched lazily if not provided", 1, function() {
    var ds = Syrah.IdentityDataSource.extend({
        lazyMany: function(parentType, parentId, itemType, collection, callback, store) {
            collection.pushObject(Foo.Phone.create({ number: "+87654321", type: "mobile" }));
            return collection;
        }
    }).create();

    var store = Foo.store = Syrah.Store.create({ ds: ds });

    var contact = Foo.Contact.create();

    store.load(contact, { firstname: 'John', lastname: 'Doe' });

    var phones = contact.get("phones");

    Ember.run.next(function() {
        equal(phones.get("length"), 1, "Associations are fetched lazily");
        start();
    });
});

test("Store has a loadMany() method to load in a collection of objects", function() {
	var store = Foo.store = Syrah.Store.create();
	var coll = store.newCollection();
	store.loadMany(Foo.Contact, coll, [
	    { firstname: 'John', lastname: 'Doe' },
	    { firstname: 'Jane', lastname: 'Doe' }
	]);

	ok(coll.get('isLoaded'));
	equal(coll.objectAt(0).get('firstname'), 'John');
	equal(coll.objectAt(1).get('firstname'), 'Jane');
});

test("Calling Store.all() should invoke his datasource's all() and return an array", function() {
	var ds = Syrah.DataSource.create({
		all: function(type, collection, callback, store) {
			ok(true, "DataSource.all() was called");
			equal(store, currentStore, "DataSource.all() was called with the right store");

			var loadedColl = callback.call(store, type, collection, [
                { firstname: 'John', lastname: 'Doe' },
	            { firstname: 'Jane', lastname: 'Doe' }
	        ]);
			equal(loadedColl.objectAt(0).get('firstname'), 'John');
			equal(loadedColl.objectAt(1).get('firstname'), 'Jane');
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	var returnedCollection = currentStore.all(Foo.Contact);
	
	ok(returnedCollection instanceof Array, "Store.all() returned an array");
});

test("Store has a toJSON() method to retrieve an object's attributes' values", function() {
	var store = Foo.store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	deepEqual(store.toJSON(contact), { firstname: 'John', lastname: 'Doe' });
});

test("Calling Store.add() should invoke his datasource's add()", function() {
	var ds = Syrah.DataSource.create({
		add: function(type, json, successCallbacks) {
			ok(true, "DataSource.add() was called");
            this.executeCallbacks(successCallbacks, json);
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didAddObject: function(object, embedded, json) {
			ok(true, "Store callback didAddObject() was called");
			deepEqual(json, { firstname: 'John', lastname: 'Doe' }, "Store callback didAddObject() was passed the JSON");
		},

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
	});
	
	currentStore.add(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }), { success: [currentStore.additionalCallback, currentStore] });
});

test("Store has a didAddObject() callback that sets the object's id when provided in the hash", function() {
	var store = Foo.store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	store.didAddObject(contact, [], { id: 12345 });
	equal(contact.get('id'), 12345);
});

test("Store has a didAddObject() callback that sets all of an object graph's IDs when the 'embedded' option is used", function() {
    var store = Foo.store = Syrah.Store.create({ds: Syrah.IdentityDataSource.create()});
    var ab = Foo.Addressbook.create({ name: "My contacts" });
    var contact1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    var phone1 = Foo.Phone.create({ number: "+12345678", type: "mobile" });
    contact1.get('phones').pushObject(phone1);
    var contact2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    var phone2 = Foo.Phone.create({ number: "+87654321", type: "mobile" });
    contact2.get('phones').pushObject(phone2);
    ab.get('contacts').pushObject(contact1);
    ab.get('contacts').pushObject(contact2);

    store.didAddObject(ab, ['contacts', 'contacts.phones'], { id: 12345, contacts: [{ id: 123, phones: [{ id: 789 }] }, { id: 456, phones: [{ id: 234 }] }] });
    equal(ab.get('id'), 12345);
    equal(contact1.get('id'), 123);
    equal(contact2.get('id'), 456);
    equal(phone1.get('id'), 789);
    equal(phone2.get('id'), 234);
});

test("Calling Store.update() should invoke his datasource's update()", function() {
	var ds = Syrah.DataSource.create({
		update: function(type, json, successCallbacks) {
			ok(true, "DataSource.update() was called");
            this.executeCallbacks(successCallbacks, json);
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didUpdateObject: function(object, json) {
			ok(true, "Store callback didUpdateObject() was called");
		},

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
	});
	
	var obj = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	currentStore.update(obj, { success: [currentStore.additionalCallback, currentStore] });
});

test("Calling Store.destroy() should invoke his datasource's destroy()", function() {
	var ds = Syrah.DataSource.create({
		destroy: function(type, json, successCallbacks) {
			ok(true, "DataSource.destroy() was called");
            this.executeCallbacks(successCallbacks, json);
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didDestroyObject: function(object) {
			ok(true, "Store callback didDestroyObject() was called");
		},

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
	});
	
	var obj = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	currentStore.destroy(obj, { success: [currentStore.additionalCallback, currentStore] });
});

test("Store has a didDestroyObject() that destroys the object", function() {
	var store = Foo.store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	store.didDestroyObject(contact);
	ok(contact.isDestroyed == true, "The object has been destroyed");
});

test("Store has an attach() method to cache the loaded persistent objects", function() {
    var store = Foo.store = Syrah.Store.create();
    var contact = Foo.Contact.create({ id:007, firstname: 'John', lastname: 'Doe' });

    store.attach(contact);

    var book = store.load(Foo.Addressbook.create(), { name: "Secret agents", contacts: [{ id:007, firstname: 'John', lastname: 'Doe' }]});

    ok(book.get('contacts').objectAt(0) === contact);
});
