module('LocalStorageDataSource test', {
	setup: function() {
		for (k in localStorage) {
			localStorage.removeItem(k);
		}
		localStorage.setItem('test:contacts:12345', JSON.stringify({ firstname: 'John', lastname: 'Doe' }));
		localStorage.setItem('test:contacts:67890', JSON.stringify({ firstname: 'Jane', lastname: 'Doe' }));
		localStorage.setItem('test:contacts', '12345,67890');
		
		ds = Inativ.LocalStorageDataSource.create({ name: 'test' });
		
		window.Foo = Ember.Namespace.create();
		Foo.Contact = Ember.Object.extend({
			firstname: null,
			lastname: null,
		});
	}
});

test("LocalStorage DS has a fetch() method to retrieve an object by key and collection name", function() {
	deepEqual(ds.fetch('contacts', '12345'), { firstname: 'John', lastname: 'Doe' });
});

test("LocalStorage DS can be used to retrieve an object", function() {
	var store = Inativ.Store.create({ds:ds});
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
	var store = Inativ.Store.create({ds:ds});
	var collection = store.all(Foo.Contact);
	
	//equal(collection.length, 2);
	equal(collection.objectAt(0).get('firstname'), 'John');
	equal(collection.objectAt(1).get('firstname'), 'Jane');
});

test("LocalStorage DS can persist an object", function() {
	var obi = Foo.Contact.create({ firstname: 'Obi-Wan', lastname: 'Kenobi' });
	var store = Inativ.Store.create({
		ds:ds,
		didAddObject: function(object, id) {
			equal(localStorage.getItem('test:contacts'), '12345,67890,'+id);
			equal(localStorage.getItem('test:contacts:'+id), JSON.stringify({ firstname: 'Obi-Wan', lastname: 'Kenobi' }));
		}
	});
	
	store.add(obi);
});