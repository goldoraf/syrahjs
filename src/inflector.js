Syrah.Inflector = Ember.Object.extend({
	
});

Syrah.Inflector.reopenClass({	
	getCollectionName: function(type) {
		return Syrah.Inflector.pluralize(Syrah.Inflector.getTypeName(type));
	},
	
	getTypeName: function(type) {
		var parts = type.toString().split(".");
	    var name = parts[parts.length - 1];
	    return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
	},
	
	pluralize: function(singular) {
		return singular + 's';
	}
});