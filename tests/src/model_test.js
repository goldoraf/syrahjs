module('Model definition test', {
	setup: function() {
        window.Foo = Ember.Namespace.create();
        Foo.Addressbook = Syrah.Model.define({
            name: String
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
            number: String
        });
	}
});

test("Basic property definition", function() {
    var Person = Syrah.Model.define({ name: String });
    p = Person.create();

    ok(p.get('name') !== undefined, "A corresponding property exists when instantiated");
    equal(p.get('name'), null, "Its default value is null");
    p.set('name', 'John');
    equal(p.get('name'), 'John', "The property can be set");
    equal(Person.create({ name: 'John' }).get('name'), 'John', "The property can be set when creating a new object");
    deepEqual(p.getDefinedProperties(), ['name'], "We can get the list of defined properties");
    equal(p.getPropertyType('name'), String, "We can get a property's type");
});

test("A model has an ID getter/setter", function() {
    var Person = Syrah.Model.define({ name: String });
    p = Person.create();
    p.set('id', 123);
    equal(p.get('id'), 123);

    var PersonWithProvidedPK = Syrah.Model.define({ primaryKey: 'PID', name: String });
    p = PersonWithProvidedPK.create();
    p.set('id', 456);
    equal(p.get('id'), 456);
});

test("A model class has a getPk() method to retrieve the primaryKey used by this model", function() {
    var Person = Syrah.Model.define({ primaryKey: 'PID', name: String });
    equal(Person.getPk(), 'PID');
});

test("A model has a isNew() method", function() {
    var Person = Syrah.Model.define({ name: String });
    p = Person.create();
    equal(p.isNew(), true);
    p.set('id', 123);
    equal(p.isNew(), false);
});

test("A model can be duplicated", function() {
    var c = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    c.set('id', 12345);
    var newContact = c.duplicate();

    equal(newContact.constructor, Foo.Contact, "The duplicated object should be of the same type");
    equal(newContact.get('id'), undefined, "The original object's ID should not be duplicated");
    equal(newContact.get('firstname'), 'John', "The original object's primitive properties should be duplicated");

    c.get('phones').pushObject(Foo.Phone.create({ number: "+12345678" }));
    c.get('phones').pushObject(Foo.Phone.create({ number: "+87654321" }));
    c.set('addressbook', Foo.Addressbook.create({ name: "My contacts" }));
    var newContact = c.duplicate({ duplicateAssociations: ['phones', 'addressbook'] });

    equal(newContact.get('phones').objectAt(0).constructor, Foo.Phone, "Duplicated HasMany associations of an object should be of the correct type");
    equal(newContact.get('phones').objectAt(0).get('number'), "+12345678", "Duplicated HasMany associations' properties should be correctly duplicated");

    equal(newContact.get('addressbook').constructor, Foo.Addressbook, "Duplicated associations of an object should be of the correct type");
    equal(newContact.get('addressbook').get('name'), "My contacts", "Duplicated associations' properties should be correctly duplicated");
});
