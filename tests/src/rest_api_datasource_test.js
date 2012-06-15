module('RESTApiDataSource test', {
	setup: function() {
		$.mockjax({
		  url: '/contacts',
		  responseText: [
		      { firstname: 'John', lastname: 'Doe' },
		      { firstname: 'Jane', lastname: 'Doe' }
		  ]
		});
		
		mockedDS = Syrah.RESTApiDataSource.create({});
		
		spiedDS = Syrah.RESTApiDataSource.create({
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

var expectUrl = function(url) {
  equal(ajaxUrl, url, "the URL is " + url);
};

var expectMethod = function(method) {
  equal(ajaxMethod, method, "the HTTP method is " + method);
};

var expectData = function(data) {
  deepEqual(ajaxData, data, "the data was passed along");
};

test("Fetching a collection makes a GET to /contacts", function() {
	var store = Syrah.Store.create({ds:spiedDS});
	store.all(Foo.Contact);
	
	expectUrl('/contacts');
	expectMethod('GET');
});

test("Fetching an object by id makes a GET to /contacts/[id]", function() {
	var store = Syrah.Store.create({ds:spiedDS});
	store.findById(Foo.Contact, '12345');
	
	expectUrl('/contacts/12345');
	expectMethod('GET');
});

test("Adding an object makes a POST to /contacts", function() {
	var store = Syrah.Store.create({ds:spiedDS});
	store.add(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }));
	
	expectUrl('/contacts');
	expectMethod('POST');
	expectData({ firstname: 'John', lastname: 'Doe' });
});

test("Updating an object makes a PUT to /contacts/[id]", function() {
	var store = Syrah.Store.create({ds:spiedDS});
	store.update(Foo.Contact.create({ id: 12345, firstname: 'John', lastname: 'Doe' }));
	
	expectUrl('/contacts/12345');
	expectMethod('PUT');
	expectData({ id: 12345, firstname: 'John', lastname: 'Doe' });
});

test("Data can be urlecoded too", function() {
    spiedDS.set('urlEncodeData', true);
    var store = Syrah.Store.create({ds:spiedDS});
    store.add(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }));

    expectUrl('/contacts');
    expectMethod('POST');
    expectData("contact.firstname=John&contact.lastname=Doe");
});

test("Destroying an object makes a DELETE to /contacts/[id]", function() {
	var store = Syrah.Store.create({ds:spiedDS});
	store.destroy(Foo.Contact.create({ id: 12345, firstname: 'John', lastname: 'Doe' }));
	
	expectUrl('/contacts/12345');
	expectMethod('DELETE');
});

test("Setting a base URL", function() {
	spiedDS.set('baseUrl', '/foo');
	var store = Syrah.Store.create({ds:spiedDS});
	store.all(Foo.Contact);
	
	expectUrl('/foo/contacts');
});

asyncTest("RESTApi DS can be used to retrieve an entire collection", function() {
	var store = Syrah.Store.create({ds:mockedDS});
	var collection = store.all(Foo.Contact);
	
	setTimeout(function() {
		equal(collection.objectAt(0).get('firstname'), 'John');
		equal(collection.objectAt(1).get('firstname'), 'Jane');
		start();
	}, 1000);
});

asyncTest("RESTApi DS ajax() method should call provided callbacks in case of success", function() {
    mockedDS.reopen({
        dummySuccessCallback: function() {
            ok(true, "The provided success callback was called");
            start();
        }
    });
    mockedDS.ajax('/contacts', 'GET', {}, [[mockedDS.dummySuccessCallback, mockedDS]]);
});

asyncTest("RESTApi DS has a isRequestSuccessful() method on which depends which callbacks will be called", function() {
    mockedDS.reopen({
        dummySuccessCallback: function() {
            ok(true, "The provided success callback was called");
            start();
        },

        isRequestSuccessful: function() {
            ok(true, "The isRequestSuccessful() method was called");
            return true;
        }
    });
    mockedDS.ajax('/contacts', 'GET', {}, [[mockedDS.dummySuccessCallback, mockedDS]]);
});

asyncTest("RESTApi DS has a isRequestSuccessful() method on which depends which callbacks will be called - simulation of an error case", function() {
    mockedDS.reopen({
        dummyErrorCallback: function() {
            ok(true, "The provided error callback was called");
            start();
        },

        isRequestSuccessful: function() {
            ok(true, "The isRequestSuccessful() method was called");
            return false;
        }
    });
    mockedDS.ajax('/contacts', 'GET', {}, [[mockedDS.dummySuccessCallback, mockedDS]], [[mockedDS.dummyErrorCallback, mockedDS]]);
});