Inativ.DataSource = Ember.Object.extend({
	
	all: null,
	find: null,
	findById: null,
	add: null,
	
	getCollectionName: function(store, object) {
		if (object instanceof Inativ.Collection) {
			type = object.get('type');
		} else {
			type = object.constructor;
		}
		return store.getCollectionName(type);
	}
	
});
