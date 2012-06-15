Syrah.DataSource = Ember.Object.extend({
	
	all: null,
	find: null,
	findById: null,
	add: null,
	
	getCollectionName: function(type) {
		return Syrah.Inflector.getCollectionName(type);
	}
	
});
