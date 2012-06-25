Syrah.Bulk = Ember.Object.extend({
    store: null,
    created: null,
    updated: null,
    deleted: null,

    init: function() {
        this._super();
        this.emptyBuckets();
    },

    save: function(object) {
        if (object.isNew()) {
            this.pushObjectInBucket('created', object);
        } else {
            this.pushObjectInBucket('updated', object);
        }
    },

    destroy: function(object) {
        this.pushObjectInBucket('deleted', object);
    },

    commit: function(options) {
        this.commitCreated(options);
        this.commitUpdated(options);
        this.commitDeleted(options);

        this.emptyBuckets();
    },

    commitCreated: function(options) {
        var store = this.get('store');
        var bucket = this.get('created');
        for (var type in bucket) {
            var json = [];
            bucket[type].forEach(function(object) {
                json.pushObject(store.toJSON(object));
            });
            var callbacks = this.prepareCallbacks(store.didAddObjects, bucket[type], options);
            store.ds.addInBulk(Ember.getPath(type), json, callbacks[0], callbacks[1]);
        }
    },

    commitUpdated: function(options) {
        var store = this.get('store');
        var bucket = this.get('updated');
        for (var type in bucket) {
            var json = [];
            bucket[type].forEach(function(object) {
                json.pushObject(store.toJSON(object));
            });
            var callbacks = this.prepareCallbacks(store.didUpdateObjects, bucket[type], options);
            store.ds.updateInBulk(Ember.getPath(type), json, callbacks[0], callbacks[1]);
        }
    },

    commitDeleted: function(options) {
        var store = this.get('store');
        var bucket = this.get('deleted');
        for (var type in bucket) {
            var json = [];
            bucket[type].forEach(function(object) {
                json.push(object.get('id'));
            });
            var callbacks = this.prepareCallbacks(store.didDestroyObjects, bucket[type], options);
            store.ds.destroyInBulk(Ember.getPath(type), json, callbacks[0], callbacks[1]);
        }
    },

    pushObjectInBucket: function(bucketName, object) {
        var bucket = this.get(bucketName),
            type = object.constructor;

        if (!bucket.hasOwnProperty(type)) bucket[type] = [];
        bucket[type].pushObject(object);
    },

    prepareCallbacks: function(mainSuccessCallback, objects, options) {
        var store = this.get('store');
        var successCallbacks = store.prepareCallbacks([mainSuccessCallback, store, objects], options, 'success');
        var errorCallbacks   = store.prepareCallbacks([store.didError, store, objects], options, 'error');
        return [successCallbacks, errorCallbacks];
    },

    emptyBuckets: function() {
        this.set('created', {});
        this.set('updated', {});
        this.set('deleted', {});
    }
});