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

test("Simple model marshalling", function() {
    var Contact = Syrah.Model.define({
        name: String
    });
    var c = Contact.create({ name: 'John Doe' });
    deepEqual(marshaller.marshall(c), { name: 'John Doe' }, "Meta properties should not be marshalled");

    c.set('id', 123);
    c.setDbRef('addressbook_id', 456);
    deepEqual(marshaller.marshall(c), { name: 'John Doe', id: 123, addressbook_id: 456 }, "DbRefs should be marshalled");

    var Contact = Syrah.Model.define({
        name: String,
        dob: Date
    });
    var dob = new Date(1969, 6, 21);
    var c = Contact.create({ name: 'John Doe', dob: dob });
    deepEqual(marshaller.marshall(c), { name: 'John Doe', dob: dob.toISOString() }, "Dates should be properly formatted");

});

test("Simple model unmarshalling", function() {
    var Contact = Syrah.Model.define({
        name: String
    });
    var loadedContact = marshaller.unmarshall({ name: 'John Doe' }, Contact.create());
    equal(loadedContact.get('name'), 'John Doe', "Defined properties should be unmarshalled");

    var loadedContact = marshaller.unmarshall({ name: 'John Doe', foo: 'bar' }, Contact.create());
    ok(loadedContact.get('foo') === undefined, "Not defined properties should be ignored");

    var loadedContact = marshaller.unmarshall({ id:123, name: 'John Doe' }, Contact.create());
    equal(loadedContact.get('id'), 123, "DbRefs can be unmarshalled");

    var Contact = Syrah.Model.define({
        name: String,
        dob: Date
    });
    var dob = new Date(1969, 6, 21);
    var loadedContact = marshaller.unmarshall({ name: 'John Doe', dob: dob.toISOString() }, Contact.create());
    deepEqual(loadedContact.get('dob'), dob, "Dates can be unmarshalled");
});

test("Model with HasMany association (un)marshalling", function() {
    window.Bar = Ember.Namespace.create();
    Bar.Addressbook = Syrah.Model.define({
        name: String,
        contacts: {
            type: Syrah.HasMany,
            itemType: "Bar.Contact"
        }
    });
    Bar.Contact = Syrah.Model.define({
        name: String,
        phones: {
            type: Syrah.HasMany,
            itemType: "Bar.Phone"
        }
    });
    Bar.Phone = Syrah.Model.define({
        number: String
    });

    var json = {
        name: 'John',
        phones: [
            { number: "+12345678" },
            { number: "+87654321" },
        ]
    };
    var loadedContact = marshaller.unmarshall(json, Bar.Contact.create());

    equal(loadedContact.get('phones').get('length'), 2, "A HasMany association can be unmarshalled");
    ok(loadedContact.get('phones').objectAt(0) instanceof Bar.Phone, "Its objects are correctly typed");
    equal(loadedContact.get('phones').objectAt(0).get('number'), '+12345678');

    var generatedJson = marshaller.marshall(loadedContact);
    ok(!generatedJson.hasOwnProperty('phones'), "HasMany associations should not be marshalled by default");

    var generatedJson = marshaller.marshall(loadedContact, { embedded: ['phones'] });
    ok(generatedJson.hasOwnProperty('phones'), "HasMany associations can be marshalled when using the 'embedded' option");
    deepEqual(generatedJson, json);

    var ab = Bar.Addressbook.create({ name: "My contacts" });
    ab.get('contacts').pushObject(loadedContact);
    var generatedJson = marshaller.marshall(ab, { embedded: ['contacts', 'contacts.phones'] });
    var expectedJson = { name: "My contacts", contacts:[{ name: "John", phones:[{ number: "+12345678"}, { number: "+87654321" }]}]}
    deepEqual(generatedJson, expectedJson, "Associations of embedded associations can also be embedded");
});

test("Model with BelongsTo association (un)marshalling", function() {
    window.Hello = Ember.Namespace.create();
    Hello.Author = Syrah.Model.define({
        name: String
    });
    Hello.Blog = Syrah.Model.define({
        title: String,
        author: Hello.Author
    });

    var json = {
        title: 'My blog',
        author: {
            name: 'John Doe'
        }
    };

    var loadedBlog = marshaller.unmarshall(json, Hello.Blog.create());

    ok(loadedBlog.get('author') !== undefined, "An associated object can be unmarshalled");
    ok(loadedBlog.get('author') instanceof Hello.Author, "It is correctly typed");
    equal(loadedBlog.get('author').get('name'), 'John Doe');
});
