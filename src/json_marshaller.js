Syrah.JSONMarshaller = Ember.Object.extend({
	
	marshall: function(object) {
		var v, attrs = [];
        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                v = this[prop];
                if (v === 'toString') {
                    continue;
                }
                if (Ember.typeOf(v) === 'function') {
                    continue;
                }
                attrs.push(prop);
            }
        }
        return object.getProperties(attrs);
	},
	
	unmarshall: function(json, object) {
		object.beginPropertyChanges();
		object.setProperties(json);
		object.endPropertyChanges();
		return object;
	} 
});