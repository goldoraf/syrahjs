module("JSON Marshaller tests", {
	setup: function() {
		marshaller = Syrah.JSONMarshaller.create();
		
		window.Foo = Ember.Namespace.create();
		Foo.Contact = Ember.Object.extend({
			firstname: null,
			lastname: null,
		});
	}
});

test("Simple object marshalling", function() {
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	deepEqual(marshaller.marshall(contact), { firstname: 'John', lastname: 'Doe' });
});