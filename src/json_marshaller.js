Syrah.JSONMarshaller = Ember.Object.extend({
	
	marshall: function(object) {
		var v, attrs = [];
        var protected = Ember.get(object.constructor, 'protectedProperties') || [];

        for (var prop in object) {
            if (object.hasOwnProperty(prop) && protected.indexOf(prop) === -1) {
                v = object[prop];
                if (v === 'toString') {
                    continue;
                }
                if (Ember.typeOf(v) === 'function') {
                    continue;
                }
                attrs.push(prop);
            }
        }
        var json = object.getProperties(attrs);

        if (object.get('parentObject') !== undefined) {

        }
        return json;
	},
	
	unmarshall: function(json, object) {
		var props = {};
		for (var k in json) {
			v = json[k];
			if (v instanceof Array) {
				props[k] = Ember.A([]);
				var assocType = this.inflectAssociationType(k, object.constructor);
				v.forEach(function(hash) {
					props[k].push(this.unmarshall(hash, assocType.create()));
				}, this);
			} else {
				props[k] = v;
			}
		}
		object.beginPropertyChanges();
		object.setProperties(props);
		object.endPropertyChanges();
		return object;
	},
	
	inflectAssociationType: function(collectionName, parentType) {
		var currentNamespace = Syrah.Inflector.getTypeNamespace(parentType);
		var possibleType = Syrah.Inflector.singularize(collectionName).camelize().ucfirst();
		
		if (window[currentNamespace] && window[currentNamespace][possibleType]) {
			return window[currentNamespace][possibleType];
		}
		return Ember.Object;
	}
});