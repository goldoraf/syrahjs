module('LocalStorageDataSource test', {
	setup: function() {
		localStorage.clear();
		localStorage.setItem('test:contacts:12345', JSON.stringify({ firstname: 'John', lastname: 'Doe' }));
		localStorage.setItem('test:contacts:67890', JSON.stringify({ firstname: 'Jane', lastname: 'Doe' }));
		localStorage.setItem('test:contacts', '12345,67890');
		
		ds = Syrah.LocalStorageDataSource.create({ name: 'test' });
		
		window.Foo = Ember.Namespace.create();
        Foo.Contact = Syrah.Model.define({
            firstname: String,
            lastname: String
        });
	}
});

test("LocalStorage DS has a fetch() method to retrieve an object by key and collection name", function() {
	deepEqual(ds.fetch('contacts', '12345'), { firstname: 'John', lastname: 'Doe' });
});

test("LocalStorage DS can be used to retrieve an object", function() {
	var store = Syrah.Store.create({ds:ds});
	var object = store.findById(Foo.Contact, '12345');
	
	equal(object.get('firstname'), 'John');
});

test("LocalStorage DS has a keys() method to retrieve all objects' keys in a collection", function() {
	deepEqual(ds.keys('contacts'), ['12345', '67890']);
});

test("LocalStorage DS has a fetchMany() method to retrieve objects by keys and collection name", function() {
	deepEqual(ds.fetchMany('contacts', ['12345', '67890']), [{ firstname: 'John', lastname: 'Doe' }, { firstname: 'Jane', lastname: 'Doe' }]);
});

test("LocalStorage DS can be used to retrieve an entire collection", function() {
	var store = Syrah.Store.create({ds:ds});
	var collection = store.all(Foo.Contact);
	
	equal(collection.get('length'), 2);
	equal(collection.objectAt(0).get('firstname'), 'John');
	equal(collection.objectAt(1).get('firstname'), 'Jane');
});

test("LocalStorage DS can persist an object", function() {
	var obi = Foo.Contact.create({ firstname: 'Obi-Wan', lastname: 'Kenobi' });
	var store = Syrah.Store.create({
		ds:ds,
		didAddObject: function(object, [], json) {
			equal(localStorage.getItem('test:contacts'), '12345,67890,'+json['id']);
			equal(localStorage.getItem('test:contacts:'+json['id']), JSON.stringify({ firstname: 'Obi-Wan', lastname: 'Kenobi' }));
		}
	});
	
	store.add(obi);
});

test("LocalStorage DS can update an object", function() {
	var obi = Foo.Contact.create({ firstname: 'Obi-Wan', lastname: 'Kenobi' });
    obi.set('id', '12345');
	var store = Syrah.Store.create({
		ds:ds,
		didUpdateObject: function(object) {
			equal(localStorage.getItem('test:contacts'), '12345,67890');
			deepEqual(JSON.parse(localStorage.getItem('test:contacts:12345')), { id: '12345', firstname: 'Obi-Wan', lastname: 'Kenobi' });
		}
	});
	
	store.update(obi);
});

test("LocalStorage DS can destroy an object", function() {
    var obi = Foo.Contact.create({ firstname: 'Obi-Wan', lastname: 'Kenobi' });
    obi.set('id', '12345');
	var store = Syrah.Store.create({
		ds:ds,
		didDestroyObject: function(object) {
			equal(localStorage.getItem('test:contacts'), '67890');
			equal(localStorage.getItem('test:contacts:12345'), null);
		}
	});
	
	store.destroy(obi);
});
