module("JSON Marshaller tests", {
	setup: function() {
		marshaller = Syrah.JSONMarshaller.create();
		
		window.Foo = Ember.Namespace.create();
		Foo.Contact = Ember.Object.extend({
			firstname: null,
			lastname: null,
			phones: []
		});
		
		Foo.Phone = Ember.Object.extend({
			type: null,
			number: null
		});
	}
});

test("Simple object marshalling", function() {
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	deepEqual(marshaller.marshall(contact), { firstname: 'John', lastname: 'Doe' });
});

test("Simple object with 1-n association unmarshalling", function() {
	var json = { 
		firstname: 'John', 
		lastname: 'Doe',
		phones: [
            { type: "mobile", number: "+12345678" },
            { type: "mobile", number: "+87654321" },
		]
	};
	var loadedContact = marshaller.unmarshall(json, Foo.Contact.create());
	
	equal(loadedContact.get('firstname'), 'John');
	ok(loadedContact.get('phones') instanceof Array);
	ok(loadedContact.get('phones').objectAt(0) instanceof Foo.Phone);
	ok(loadedContact.get('phones').objectAt(1) instanceof Foo.Phone);
	equal(loadedContact.get('phones').objectAt(0).get('number'), '+12345678');
	equal(loadedContact.get('phones').objectAt(1).get('number'), '+87654321');
});

test("Simple model marshalling", function() {
    var Contact = Syrah.Model.define({
        name: String
    });
    var c = Contact.create({ name: 'John Doe' });
    deepEqual(marshaller.marshall(c), { name: 'John Doe' }, "Meta properties should not be marshalled");

    c.set('id', 123);
    c.setDbRef('addressbook_id', 456);
    deepEqual(marshaller.marshall(c), { name: 'John Doe', id: 123, addressbook_id: 456 }, "DbRefs should be marshalled");
});

