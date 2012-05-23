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

test("Marshaller has a method() to guess an association's type", function() {
	equal(marshaller.inflectAssociationType('phones', Foo.Contact), Foo.Phone);
});

test("Object with 1-n association unmarshalling", function() {
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

/*test("Object with 1-n association marshalling", function() {
	var contact = Foo.Contact.create({ 
		firstname: 'John', 
		lastname: 'Doe',
		addresses: [
            Foo.Address.create({ street: "5th avenue", city: "NYC" }),
            Foo.Address.create({ street: "rue de la Pompe", city: "Paris" }),
		]
	});
	var json = { 
		firstname: 'John', 
		lastname: 'Doe',
		addresses: [
            { street: "5th avenue", city: "NYC" },
            { street: "rue de la Pompe", city: "Paris" },
		]
	};
});*/
