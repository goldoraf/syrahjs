module('Bulk tests', {
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
});