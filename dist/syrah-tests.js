module('Associations test', {
    setup: function() {
        window.Foo = Ember.Namespace.create();
        Foo.store = Syrah.Store.create({ds: Syrah.IdentityDataSource.create()});
        Foo.Phone = Syrah.Model.define({
            type: String,
            number: String
        });
        Foo.Contact = Syrah.Model.define({
            name: String,
            phones: {
                type: Syrah.HasMany,
                itemType: Foo.Phone
            }
        });
        Foo.Author = Syrah.Model.define({
            name: String
        });
        Foo.Blog = Syrah.Model.define({
            title: String,
            author: Foo.Author
        });
        Foo.Post = Syrah.Model.define({
            title: String,
            content: String,
            comments: {
                type: Syrah.HasMany,
                itemType: "Foo.Comment",
                inverseOf: 'post'
            }
        });
        Foo.Comment = Syrah.Model.define({
            author: String,
            content: String,
            post: {
                type: Foo.Post,
                inverseOf: 'comments'
            }
        });
    }
});

test("A model has a getAssociations() method that list the defined associations", function() {
    var c = Foo.Contact.create();
    deepEqual(Ember.keys(c.getAssociations()), ['phones']);
});

test("HasMany association definition", function() {
    var c = Foo.Contact.create();
    ok(c.get('phones') instanceof Syrah.HasMany, "A collection property has been set");
});

test("HasMany association usage", function() {
    var contact = Foo.Contact.create({ id: 1234, firstname: 'John', lastname: 'Doe' });
    var phone = Foo.Phone.create({ type: 'mobile', number: '+123456' });
    ok(contact.get('phones').get('owner') !== undefined, "A HasMany collection should maintain a link to its owner");
    equal(contact.get('phones').get('owner').get('firstname'), 'John', "A HasMany collection should maintain a link to its owner");

    contact.get('phones').pushObject(phone);
    equal(contact.get('phones').objectAt(0).getDbRef('contact_id'), 1234, "An object in a HasMany collection should maintain a DbRef to its owner ID");

    var contact2 = Foo.Contact.create({ id: 5678, firstname: 'Jane', lastname: 'Doe' });
    equal(contact2.get('phones').get('length'), 0, "Different objects should have different HasMany collections");
});

test("BelongsTo association usage", function() {
    var blog = Foo.Blog.create({ title: 'Ember & JS' });
    var author = Foo.Author.create({ id: 5678, name: 'John Doe' });
    equal(blog.get('author').get('isLoaded'), false);

    blog.set('author', author);

    equal(blog.getDbRef('author_id'), 5678, "An object should maintain a FK to the object it belongs to");
    equal(blog.get('author').get('name'), 'John Doe', "The object it belongs to can be retrieved");

    var anonymousBlog = Foo.Blog.create({ title: 'Ember & JS', author: null });
    equal(anonymousBlog.get('author'), null);
});

test("Bi-directional associations", function() {
    var post = Foo.Post.create({ title: 'Javascript rulez !' });
    var comment = Foo.Comment.create({ author: 'jdoe', content: 'I agree !' });
    post.get('comments').pushObject(comment);

    equal(comment.get('post').get('title'), post.get('title'), "Inverseof a HasMany association should be set when an object is pushed");

    var comment2 = Foo.Comment.create({ author: 'jane', content: 'I disagree !' });
    comment2.set('post', post);

    equal(post.get('comments').get('length'), 2);
    equal(post.get('comments').objectAt(1).get('author'), 'jane');
});

test("Computed properties dependent of associations", function() {
    Foo.Post.reopen({
        publishedComments: function() {
            return this.get('comments').filterProperty('published', true);
        }.property('comments.@each.published')
    });
    var post = Foo.Post.create({ title: 'Javascript rulez !' });
    post.get('comments').pushObject(Foo.Comment.create({ author: 'jdoe', content: 'I agree !', published: true }));

    equal(post.get('publishedComments').get('length'), 1);
});module('Bulk tests', {
    setup: function() {
        window.Foo = Ember.Namespace.create();
        Foo.Contact = Syrah.Model.define({
            firstname: String,
            lastname: String
        });
    }
});

test("Committing a bulk with created objects should invoke his store's datasource's addInBulk()", function() {
    var ds = Syrah.DataSource.create({
        addInBulk: function(type, json, successCallbacks) {
            ok(true, "DataSource.addInBulk() was called");
            this.executeCallbacks(successCallbacks, [{ id: 123, firstname: 'John', lastname: 'Doe' }, { id: 456, firstname: 'Jane', lastname: 'Doe' }]);
        }
    });

    var store = Syrah.Store.create({ ds: ds });
    store.reopen({
        didAddObjects: function(objects, json) {
            ok(true, "Store callback didAddObjects() was called");
            this._super(objects, json);
        },

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
            equal(contact1.get('id'), 123, "The created object was set an ID");
        }
    });

    var bulk = store.bulk();
    var contact1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    var contact2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    bulk.save(contact1);
    bulk.save(contact2);
    bulk.commit({ success: [store.additionalCallback, store] });
});

test("Committing a bulk with updated objects should invoke his store's datasource's updateInBulk()", function() {
    var ds = Syrah.DataSource.create({
        updateInBulk: function(type, json, successCallbacks) {
            ok(true, "DataSource.updateInBulk() was called");
            this.executeCallbacks(successCallbacks, json);
        }
    });

    var store = Syrah.Store.create({ ds: ds });
    store.reopen({
        didUpdateObjects: function(objects, json) {
            ok(true, "Store callback didUpdateObjects() was called");
        },

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
    });

    var bulk = store.bulk();
    var contact1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    var contact2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    contact1.set('id', 12345);
    contact2.set('id', 67890);
    bulk.save(contact1);
    bulk.save(contact2);
    bulk.commit({ success: [store.additionalCallback, store] });
});

test("Committing a bulk with deleted objects should invoke his store's datasource's destroyInBulk()", function() {
    var ds = Syrah.DataSource.create({
        destroyInBulk: function(type, json, successCallbacks) {
            ok(true, "DataSource.destroyInBulk() was called");
            this.executeCallbacks(successCallbacks, json);
        }
    });

    var store = Syrah.Store.create({ ds: ds });
    store.reopen({
        didDestroyObjects: function(objects) {
            ok(true, "Store callback didDestroyObjects() was called");
        },

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
    });

    var bulk = store.bulk();
    var contact1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    var contact2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    contact1.set('id', 12345);
    contact2.set('id', 67890);
    bulk.destroy(contact1);
    bulk.destroy(contact2);
    bulk.commit({ success: [store.additionalCallback, store] });
});Syrah.IdentityDataSource = Syrah.DataSource.extend({

	all: function(type, collection, callback, store) {
        Ember.run.next(function() {
            callback.call(store, type, collection, []);
        });
		return collection;
	},
	
	findById: function(type, object, id, callback, store) {
        Ember.run.next(function() {
            callback.call(store, object, {});
        });
		return object;
	},
	
	add: function(type, json, successCallbacks, errorCallbacks) {
        Ember.run.next(function() {
            this.executeCallbacks(successCallbacks, {});
        });
	},
	
	update: function(type, json, successCallbacks, errorCallbacks) {
        Ember.run.next(function() {
            this.executeCallbacks(successCallbacks, {});
        });
	},
	
	destroy: function(type, json, successCallbacks, errorCallbacks) {
        Ember.run.next(function() {
            this.executeCallbacks(successCallbacks, {});
        });
	},

    lazyMany: function(parentType, parentId, itemType, collection, callback, store) {
        Ember.run.next(function() {
            callback.call(store, itemType, collection, []);
        });
    },

    lazyOne: function(parentType, parentId, itemType, object, callback, store) {
        Ember.run.next(function() {
            callback.call(store, object, {});
        });
    }
	
});
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
});module("JSON Marshaller tests", {
	setup: function() {
		marshaller = Syrah.Store.create();
		
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
    ab.set('contacts', [loadedContact]);
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
module('LocalStorageDataSource test', {
	setup: function() {
		localStorage.clear();
		localStorage.setItem('test:contacts:12345', JSON.stringify({ firstname: 'John', lastname: 'Doe' }));
		localStorage.setItem('test:contacts:67890', JSON.stringify({ firstname: 'Jane', lastname: 'Doe' }));
		localStorage.setItem('test:contacts', '12345,67890');
		
		ds = Syrah.LocalStorageDataSource.create({ name: 'test' });
		
		window.Foo = Ember.Namespace.create();
        Foo.Contact = Syrah.Model.define({
            firstname: String,
            lastname: String
        });
	}
});

test("LocalStorage DS has a fetch() method to retrieve an object by key and collection name", function() {
	deepEqual(ds.fetch('contacts', '12345'), { firstname: 'John', lastname: 'Doe' });
});

test("LocalStorage DS can be used to retrieve an object", function() {
	var store = Syrah.Store.create({ds:ds});
	var object = store.findById(Foo.Contact, '12345');
	
	equal(object.get('firstname'), 'John');
});

test("LocalStorage DS has a keys() method to retrieve all objects' keys in a collection", function() {
	deepEqual(ds.keys('contacts'), ['12345', '67890']);
});

test("LocalStorage DS has a fetchMany() method to retrieve objects by keys and collection name", function() {
	deepEqual(ds.fetchMany('contacts', ['12345', '67890']), [{ firstname: 'John', lastname: 'Doe' }, { firstname: 'Jane', lastname: 'Doe' }]);
});

test("LocalStorage DS can be used to retrieve an entire collection", function() {
	var store = Syrah.Store.create({ds:ds});
	var collection = store.all(Foo.Contact);
	
	equal(collection.get('length'), 2);
	equal(collection.objectAt(0).get('firstname'), 'John');
	equal(collection.objectAt(1).get('firstname'), 'Jane');
});

test("LocalStorage DS can persist an object", function() {
	var obi = Foo.Contact.create({ firstname: 'Obi-Wan', lastname: 'Kenobi' });
	var store = Syrah.Store.create({
		ds:ds,
		didAddObject: function(object, embedded, json) {
			equal(localStorage.getItem('test:contacts'), '12345,67890,'+json['id']);
			equal(localStorage.getItem('test:contacts:'+json['id']), JSON.stringify({ firstname: 'Obi-Wan', lastname: 'Kenobi' }));
		}
	});
	
	store.add(obi);
});

test("LocalStorage DS can update an object", function() {
	var obi = Foo.Contact.create({ firstname: 'Obi-Wan', lastname: 'Kenobi' });
    obi.set('id', '12345');
	var store = Syrah.Store.create({
		ds:ds,
		didUpdateObject: function(object) {
			equal(localStorage.getItem('test:contacts'), '12345,67890');
			deepEqual(JSON.parse(localStorage.getItem('test:contacts:12345')), { id: '12345', firstname: 'Obi-Wan', lastname: 'Kenobi' });
		}
	});
	
	store.update(obi);
});

test("LocalStorage DS can destroy an object", function() {
    var obi = Foo.Contact.create({ firstname: 'Obi-Wan', lastname: 'Kenobi' });
    obi.set('id', '12345');
	var store = Syrah.Store.create({
		ds:ds,
		didDestroyObject: function(object) {
			equal(localStorage.getItem('test:contacts'), '67890');
			equal(localStorage.getItem('test:contacts:12345'), null);
		}
	});
	
	store.destroy(obi);
});
module('Model definition test', {
	setup: function() {
        window.Foo = Ember.Namespace.create();
        Foo.store = Syrah.Store.create({ds: Syrah.IdentityDataSource.create()});
        Foo.Addressbook = Syrah.Model.define({
            name: String,
            contacts: {
                type: Syrah.HasMany,
                itemType: "Foo.Contact",
                inverseOf: "addressbook"
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
            number: String
        });
	}
});

test("Basic property definition", function() {
    var Person = Syrah.Model.define({ name: String });
    p = Person.create();

    ok(p.get('name') !== undefined, "A corresponding property exists when instantiated");
    equal(p.get('name'), null, "Its default value is null");
    equal(p.getPropertyDefault('name'), null, "We can get a property's default value");
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
    var ab = Foo.Addressbook.create({ name: "My contacts" });
    c.set('addressbook', ab);
    var newContact = c.duplicate({ duplicateAssociations: ['phones', 'addressbook'] });

    equal(newContact.get('phones').objectAt(0).constructor, Foo.Phone, "Duplicated HasMany associations of an object should be of the correct type");
    equal(newContact.get('phones').objectAt(0).get('number'), "+12345678", "Duplicated HasMany associations' properties should be correctly duplicated");

    equal(newContact.get('addressbook').constructor, Foo.Addressbook, "Duplicated associations of an object should be of the correct type");
    equal(newContact.get('addressbook').get('name'), "My contacts", "Duplicated associations' properties should be correctly duplicated");

    ab.get('contacts').pushObject(c);
    var newAb = ab.duplicate({ duplicateAssociations: ['contacts', 'contacts.phones'] });

    equal(newAb.get('contacts').objectAt(0).get('phones').objectAt(0).constructor, Foo.Phone, "Duplicated HasMany sub-associations of an object should be of the correct type");
    equal(newAb.get('contacts').objectAt(0).get('phones').objectAt(0).get('number'), "+12345678", "Duplicated HasMany sub-associations' properties should be correctly duplicated");

    equal(newAb.get('contacts').objectAt(0).get('addressbook').constructor, Foo.Addressbook, "Duplicated HasMany associations of an object should maintain their association with their parent object");
});
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

test("Lazy loading of a child collection makes a GET to /contacts/[id]/phones", function() {
    var store = Foo.store = Syrah.Store.create({ds:spiedDS});
    var contact = Foo.Contact.create({id: '12345', firstname: 'John', lastname: 'Doe'});
    contact.get('phones');

    expectUrl('/contacts/12345/phones');
    expectMethod('GET');
});

test("Lazy loading of a child entity makes a GET to /contacts/[id]/adressbook", function() {
    var store = Foo.store = Syrah.Store.create({ds:spiedDS});
    var contact = Foo.Contact.create({id: '12345', firstname: 'John', lastname: 'Doe'});
    contact.get('addressbook');

    expectUrl('/contacts/12345/addressbook');
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
    var store = Foo.store = Syrah.Store.create({ds:spiedDS});
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
});module('Store tests', {
	setup: function() {
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

test("Store has a load() method to load in attributes in an object", function() {
	var store = Foo.store = Syrah.Store.create({ds: Syrah.IdentityDataSource.create()});
	var contact = Foo.Contact.create();

    equal(contact.get("isLoaded"), false, "When a new Syrah object is created, its isLoaded property is set to false");

	store.load(contact, { firstname: 'John', lastname: 'Doe' });

    equal(contact.get("isLoaded"), true, "isLoaded is true once the store loaded the object");
    equal(contact.get('phones').get("isLoaded"), false,
        "A HasMany association not included in the JSON has a isLoaded property set to false");
    equal(contact.get('addressbook').get("isLoaded"), false,
        "A BelongsTo association not included in the JSON has a isLoaded property set to false");

	equal(contact.get('firstname'), 'John');
	equal(contact.get('lastname'), 'Doe');
});

test("The store load() method works with a graph of objects", function() {
    var store = Foo.store = Syrah.Store.create();
    var contact = Foo.Contact.create();

    store.load(contact, {
        firstname: 'John',
        lastname: 'Doe',
        phones: [{ number: "+87654321", type: "mobile" }]
    });

    equal(contact.get('phones').get("isLoaded"), true,
        "A HasMany association included in the JSON has a isLoaded property set to true");

    equal(contact.get('phones').get('length'), 1);
    equal(contact.get('phones').objectAt(0).get('number'), "+87654321");
    equal(contact.get('phones').objectAt(0).get('type'), "mobile");

});

test("Store has a newCollection() method that returns an array with a isLoaded property set to false", function() {
    var store = Foo.store = Syrah.Store.create();
    var coll = store.newCollection();
    equal(coll.get('isLoaded'), false);
});

test("Calling Store.findById() should invoke his datasource's findById() and return an object", function() {
	var ds = Syrah.DataSource.create({
		findById: function(type, object, id, callback, store) {
			ok(true, "DataSource.findById() was called");
			equal(store, currentStore, "DataSource.findById() was called with the right store");
			
			var loadedObject = callback.call(store, object, { firstname: 'John', lastname: 'Doe' });
			equal(loadedObject.get('firstname'), 'John', "DataSource.findById() was called with a callback to Store.load()");
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	var returnedObject = currentStore.findById(Foo.Contact, 1);
	
	ok(returnedObject instanceof Foo.Contact, "Store.findById() returned an object");
});

asyncTest("Associations are fetched lazily if not provided", 1, function() {
    var ds = Syrah.IdentityDataSource.extend({
        lazyMany: function(parentType, parentId, itemType, collection, callback, store) {
            collection.pushObject(Foo.Phone.create({ number: "+87654321", type: "mobile" }));
            return collection;
        }
    }).create();

    var store = Foo.store = Syrah.Store.create({ ds: ds });

    var contact = Foo.Contact.create();

    store.load(contact, { firstname: 'John', lastname: 'Doe' });

    var phones = contact.get("phones");

    Ember.run.next(function() {
        equal(phones.get("length"), 1, "Associations are fetched lazily");
        start();
    });
});

test("Store has a loadMany() method to load in a collection of objects", function() {
	var store = Foo.store = Syrah.Store.create();
	var coll = store.newCollection();
	store.loadMany(Foo.Contact, coll, [
	    { firstname: 'John', lastname: 'Doe' },
	    { firstname: 'Jane', lastname: 'Doe' }
	]);

	ok(coll.get('isLoaded'));
	equal(coll.objectAt(0).get('firstname'), 'John');
	equal(coll.objectAt(1).get('firstname'), 'Jane');
});

test("Calling Store.all() should invoke his datasource's all() and return an array", function() {
	var ds = Syrah.DataSource.create({
		all: function(type, collection, callback, store) {
			ok(true, "DataSource.all() was called");
			equal(store, currentStore, "DataSource.all() was called with the right store");

			var loadedColl = callback.call(store, type, collection, [
                { firstname: 'John', lastname: 'Doe' },
	            { firstname: 'Jane', lastname: 'Doe' }
	        ]);
			equal(loadedColl.objectAt(0).get('firstname'), 'John');
			equal(loadedColl.objectAt(1).get('firstname'), 'Jane');
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	var returnedCollection = currentStore.all(Foo.Contact);
	
	ok(returnedCollection instanceof Array, "Store.all() returned an array");
});

test("Store has a toJSON() method to retrieve an object's attributes' values", function() {
	var store = Foo.store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	deepEqual(store.toJSON(contact), { firstname: 'John', lastname: 'Doe' });
});

test("Calling Store.add() should invoke his datasource's add()", function() {
	var ds = Syrah.DataSource.create({
		add: function(type, json, successCallbacks) {
			ok(true, "DataSource.add() was called");
            this.executeCallbacks(successCallbacks, json);
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didAddObject: function(object, embedded, json) {
			ok(true, "Store callback didAddObject() was called");
			deepEqual(json, { firstname: 'John', lastname: 'Doe' }, "Store callback didAddObject() was passed the JSON");
		},

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
	});
	
	currentStore.add(Foo.Contact.create({ firstname: 'John', lastname: 'Doe' }), { success: [currentStore.additionalCallback, currentStore] });
});

test("Store has a didAddObject() callback that sets the object's id when provided in the hash", function() {
	var store = Foo.store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	store.didAddObject(contact, [], { id: 12345 });
	equal(contact.get('id'), 12345);
});

test("Store has a didAddObject() callback that sets all of an object graph's IDs when the 'embedded' option is used", function() {
    var store = Foo.store = Syrah.Store.create({ds: Syrah.IdentityDataSource.create()});
    var ab = Foo.Addressbook.create({ name: "My contacts" });
    var contact1 = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
    var phone1 = Foo.Phone.create({ number: "+12345678", type: "mobile" });
    contact1.get('phones').pushObject(phone1);
    var contact2 = Foo.Contact.create({ firstname: 'Jane', lastname: 'Doe' });
    var phone2 = Foo.Phone.create({ number: "+87654321", type: "mobile" });
    contact2.get('phones').pushObject(phone2);
    ab.get('contacts').pushObject(contact1);
    ab.get('contacts').pushObject(contact2);

    store.didAddObject(ab, ['contacts', 'contacts.phones'], { id: 12345, contacts: [{ id: 123, phones: [{ id: 789 }] }, { id: 456, phones: [{ id: 234 }] }] });
    equal(ab.get('id'), 12345);
    equal(contact1.get('id'), 123);
    equal(contact2.get('id'), 456);
    equal(phone1.get('id'), 789);
    equal(phone2.get('id'), 234);
});

test("Calling Store.update() should invoke his datasource's update()", function() {
	var ds = Syrah.DataSource.create({
		update: function(type, json, successCallbacks) {
			ok(true, "DataSource.update() was called");
            this.executeCallbacks(successCallbacks, json);
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didUpdateObject: function(object, json) {
			ok(true, "Store callback didUpdateObject() was called");
		},

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
	});
	
	var obj = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	currentStore.update(obj, { success: [currentStore.additionalCallback, currentStore] });
});

test("Calling Store.destroy() should invoke his datasource's destroy()", function() {
	var ds = Syrah.DataSource.create({
		destroy: function(type, json, successCallbacks) {
			ok(true, "DataSource.destroy() was called");
            this.executeCallbacks(successCallbacks, json);
		}
	});
	
	var currentStore = Foo.store = Syrah.Store.create({ ds: ds });
	currentStore.reopen({
		didDestroyObject: function(object) {
			ok(true, "Store callback didDestroyObject() was called");
		},

        additionalCallback: function(json) {
            ok(true, "The provided 'success' option callback was called");
        }
	});
	
	var obj = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	currentStore.destroy(obj, { success: [currentStore.additionalCallback, currentStore] });
});

test("Store has a didDestroyObject() that destroys the object", function() {
	var store = Foo.store = Syrah.Store.create();
	var contact = Foo.Contact.create({ firstname: 'John', lastname: 'Doe' });
	
	store.didDestroyObject(contact);
	ok(contact.isDestroyed == true, "The object has been destroyed");
});
