Syrah.Inflector = Ember.Object.extend({
	
});

Syrah.Inflector.reopenClass({	
	getCollectionName: function(type) {
		return Syrah.Inflector.pluralize(Syrah.Inflector.getTypeName(type));
	},
	
	getTypeName: function(type) {
		var parts = type.toString().split(".");
	    var name = parts[parts.length - 1];
	    return name.underscore();
	},
	
	getTypeNamespace: function(type) {
		return type.toString().split(".")[0];
	},
	
	pluralize: function(singular) {
		return singular + 's';
	},
	
	singularize: function(plural) {
		return plural.slice(0, -1);
	},
	
	ucfirst: function(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}
});

String.prototype.ucfirst = function() {
    return Syrah.Inflector.ucfirst(this);
};