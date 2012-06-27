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
			ajax: function(type, url, method, options) {
				ajaxUrl = url;
				ajaxMethod = method;
				ajaxData = options.data;
			}
		});
		
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
	var c = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    c.set('id', 12345);
    var store = Syrah.Store.create({ds:spiedDS});
	store.update(c);
	
	expectUrl('/contacts/12345');
	expectMethod('PUT');
	expectData({ id: 12345, firstname: 'John', lastname: 'Doe' });
});

test("Data can be urlencoded too", function() {
    spiedDS.set('urlEncodeData', true);
    var store = Syrah.Store.create({ds:spiedDS});
    store.add(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }));

    expectData("contact.firstname=John&contact.lastname=Doe");

    var bulk = store.bulk();
    bulk.save(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }));
    bulk.save(Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' }));
    bulk.commit();

    expectData("contact[0].firstname=John&contact[0].lastname=Doe&contact[1].firstname=Jane&contact[1].lastname=Doe");

    var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    contact.get('phones').pushObject(Foo.Phone.create({ number: "+12345678", type: "mobile" }));
    contact.get('phones').pushObject(Foo.Phone.create({ number: "+87654321", type: "mobile" }));
    var ab = Foo.Addressbook.create({ name: "My contacts" });
    contact.set('addressbook', ab);
    store.add(contact, { embedded: ['phones', 'addressbook'] });

    expectData("contact.firstname=John&contact.lastname=Doe&contact.addressbook.name=My%20contacts&contact.phones[0].number=%2B12345678&contact.phones[0].type=mobile&contact.phones[1].number=%2B87654321&contact.phones[1].type=mobile");

    ab.get('contacts').pushObject(contact);
    store.add(ab, { embedded: ['contacts', 'contacts.phones'] });

    expectData("addressbook.name=My%20contacts&addressbook.contacts[0].firstname=John&addressbook.contacts[0].lastname=Doe&addressbook.contacts[0].phones[0].number=%2B12345678&addressbook.contacts[0].phones[0].type=mobile&addressbook.contacts[0].phones[1].number=%2B87654321&addressbook.contacts[0].phones[1].type=mobile");

    var bulk = store.bulk();
    var contact1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    var contact2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    contact1.set('id', 12345);
    contact2.set('id', 67890);
    bulk.destroy(contact1);
    bulk.destroy(contact2);
    bulk.commit();

    expectData("id[0]=12345&id[1]=67890");
});

test("Destroying an object makes a DELETE to /contacts/[id]", function() {
    var c = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    c.set('id', 12345);
    var store = Syrah.Store.create({ds:spiedDS});
	store.destroy(c);
	
	expectUrl('/contacts/12345');
	expectMethod('DELETE');
});

test("Adding in bulk objects makes a POST to /contacts/bulk", function() {
    var store = Syrah.Store.create({ds:spiedDS});
    var bulk = store.bulk();
    bulk.save(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }));
    bulk.save(Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' }));
    bulk.commit();

    expectUrl('/contacts/bulk');
    expectMethod('POST');
    expectData([{ firstname: 'John', lastname: 'Doe' }, { firstname: 'Jane', lastname: 'Doe' }]);
});

test("Updating in bulk objects makes a PUT to /contacts/bulk", function() {
    var store = Syrah.Store.create({ds:spiedDS});
    var bulk = store.bulk();
    var c1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    c1.set('id', 12345);
    var c2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    c2.set('id', 67890);
    bulk.save(c1);
    bulk.save(c2);
    bulk.commit();

    expectUrl('/contacts/bulk');
    expectMethod('PUT');
    expectData([{ id: 12345, firstname: 'John', lastname: 'Doe' }, { id: 67890, firstname: 'Jane', lastname: 'Doe' }]);
});

test("Deleting in bulk objects makes a DELETE to /contacts/bulk", function() {
    var store = Syrah.Store.create({ds:spiedDS});
    var bulk = store.bulk();
    var c1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    c1.set('id', 12345);
    var c2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    c2.set('id', 67890);
    bulk.destroy(c1);
    bulk.destroy(c2);
    bulk.commit();

    expectUrl('/contacts/bulk');
    expectMethod('DELETE');
    expectData([12345, 67890]);
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
    var mockedDS = Syrah.RESTApiDataSource.create({});
    mockedDS.reopen({
        dummySuccessCallback: function() {
            ok(true, "The provided success callback was called");
            start();
        }
    });
    mockedDS.ajax(Foo.Contact, '/contacts', 'GET', {}, [[mockedDS.dummySuccessCallback, mockedDS]]);
});

asyncTest("RESTApi DS has a isRequestSuccessful() method on which depends which callbacks will be called", function() {
    var mockedDS = Syrah.RESTApiDataSource.create({});
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
    mockedDS.ajax(Foo.Contact, '/contacts', 'GET', {}, [[mockedDS.dummySuccessCallback, mockedDS]]);
});

asyncTest("RESTApi DS has a isRequestSuccessful() method on which depends which callbacks will be called - simulation of an error case", function() {
    var mockedDS = Syrah.RESTApiDataSource.create({});
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
    mockedDS.ajax(Foo.Contact, '/contacts', 'GET', {}, [[mockedDS.dummySuccessCallback, mockedDS]], [[mockedDS.dummyErrorCallback, mockedDS]]);
});