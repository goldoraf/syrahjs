module('Model test', {
	setup: function() {
		window.Foo = Ember.Namespace.create();
		Foo.Contact = Syrah.Model.extend({
			primaryKey: 'CID',
			firstname: null,
			lastname: null,
		});
	}
});

test("A model has an ID getter/setter", function() {
	var contact = Foo.Contact.create();
	contact.set('id', 12345);
	equal(contact.get('id'), 12345);
	equal(contact.get('CID'), 12345);
	
	contact.set('CID', 67890);
	equal(contact.get('id'), 67890);
	equal(contact.get('CID'), 67890);
});