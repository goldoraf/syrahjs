Syrah.IdentityDataSource = Syrah.DataSource.extend({

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
