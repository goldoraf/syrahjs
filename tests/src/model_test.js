module('Model definition test', {
	setup: function() {

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
})
