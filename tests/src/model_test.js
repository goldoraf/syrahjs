module('Model test', {
	setup: function() {
		window.Foo = Ember.Namespace.create();
        Foo.Phone = Syrah.Model.extend({
            type: null,
            number: null
        });
        Foo.Contact = Syrah.Model.extend({
			primaryKey: 'CID',
			firstname: null,
			lastname: null,
			phones: Syrah.hasMany(Foo.Phone)
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

test("HasMany association", function() {
	var contact = Foo.Contact.create({ id: 1234, firstname: 'John', lastname: 'Doe' });
	var phone = Foo.Phone.create({ type: 'mobile', number: '+123456' });
	ok(contact.get('phones').get('parentObject') !== undefined, "A HasMany collection should maintain a link to its parent object");
    equal(contact.get('phones').get('parentObject').get('firstname'), 'John', "A HasMany collection should maintain a link to its parent object");

    contact.get('phones').pushObject(phone);
    equal(contact.get('phones').objectAt(0).get('contact_id'), 1234, "An object in a HasMany collection should maintain a FK to its parent object");
});