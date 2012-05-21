module('RESTApiDataSource test', {
	setup: function() {
		$.mockjax({
		  url: '/contacts',
		  //responseTime: 750,
		  responseText: [
		      { firstname: 'John', lastname: 'Doe' },
		      { firstname: 'Jane', lastname: 'Doe' }
		  ]
		});
		
		mockedDS = Inativ.RESTApiDataSource.create();
		
		spiedDS = Inativ.RESTApiDataSource.create({
			ajax: function(url, method, options) {
				ajaxUrl = url;
				ajaxMethod = method;
				ajaxData = options.data;
			}
		});
		
		window.Foo = Ember.Namespace.create();
		Foo.Contact = Ember.Object.extend();
	}
});

var expectUrl = function(url, desc) {
  equal(ajaxUrl, url, "the URL is " + desc);
};

var expectMethod = function(method) {
  equal(ajaxMethod, method, "the HTTP method is " + method);
};

var expectData = function(data) {
  deepEqual(ajaxData, data, "the data was passed along");
};

test("Fetching a collection makes a GET to /contacts", function() {
	var store = Inativ.Store.create({ds:spiedDS});
	var collection = store.all(Foo.Contact);
	
	expectUrl('/contacts');
	expectMethod('GET');
});

test("Fetching an object by id makes a GET to /contacts/[id]", function() {
	var store = Inativ.Store.create({ds:spiedDS});
	var object = store.findById(Foo.Contact, '12345');
	
	expectUrl('/contacts/12345');
	expectMethod('GET');
});

test("Adding an object makes a POST to /contacts", function() {
	var store = Inativ.Store.create({ds:spiedDS});
	store.add(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }));
	
	expectUrl('/contacts');
	expectMethod('POST');
	expectData({ firstname: 'John', lastname: 'Doe' });
});

asyncTest("RESTApi DS can be used to retrieve an entire collection", function() {
	var store = Inativ.Store.create({ds:mockedDS});
	var collection = store.all(Foo.Contact);
	
	setTimeout(function() {
		equal(collection.objectAt(0).get('firstname'), 'John');
		equal(collection.objectAt(1).get('firstname'), 'Jane');
		start();
	}, 1000);
});