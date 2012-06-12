module('Inflector tests', {
	setup: function() {
		window.Foo = Ember.Namespace.create();
		Foo.BarTest = Ember.Object.extend();
        Foo.Contact = Ember.Object.extend();
        Foo.Phone = Ember.Object.extend();
	}
});

test("Inflector has a getTypeName() method to get a type's name in underscored lowercase", function() {
	equal(Syrah.Inflector.getTypeName(Foo.BarTest), 'bar_test');
});

test("Inflector has a getTypeNamespace() method to get a type's namespace", function() {
	equal(Syrah.Inflector.getTypeNamespace(Foo.BarTest), 'Foo');
});

test("Inflector has a getCollectionName() method to get a pluralized type's name", function() {
	equal(Syrah.Inflector.getCollectionName(Foo.BarTest), 'bar_tests');
});

test("Inflector has a method() to guess an association's type", function() {
    equal(Syrah.Inflector.guessAssociationType('phones', Foo.Contact), Foo.Phone);
});

test("Inflector has a pluralize() method", function() {
	equal(Syrah.Inflector.pluralize('process'), 'processes');
	equal(Syrah.Inflector.pluralize('query'), 'queries');
	equal(Syrah.Inflector.pluralize('wife'), 'wives');
	equal(Syrah.Inflector.pluralize('person'), 'people');
	equal(Syrah.Inflector.pluralize('test'), 'tests');
});

test("Inflector has a singular() method", function() {
	equal(Syrah.Inflector.singularize('processes'), 'process');
	equal(Syrah.Inflector.singularize('queries'), 'query');
	equal(Syrah.Inflector.singularize('wives'), 'wife');
	equal(Syrah.Inflector.singularize('people'), 'person');
	equal(Syrah.Inflector.singularize('tests'), 'test');
});

test("Inflector has a getFkForType() method to get a FK from a type", function() {
    equal(Syrah.Inflector.getFkForType(Foo.Contact), 'contact_id');
});