Syrah.DataSource = Ember.Object.extend({
	
	all: null,
	find: null,
	findById: null,
	add: null,
	
	getCollectionName: function(store, type) {
		return store.getCollectionName(type);
	}
	
});
