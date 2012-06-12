Syrah.JSONMarshaller = Ember.Object.extend({
	
	marshall: function(object) {
		if (object instanceof Syrah.Model) return this.marshallModel(object);
        return this.marshallSimpleObject(object);
	},

    unmarshall: function(json, object) {
        if (object instanceof Syrah.Model) return this.unmarshallModel(json, object);
        return this.unmarshallSimpleObject(json, object);
    },

    marshallModel: function(object) {
        var definedProps = object.getDefinedProperties();
        var json = object.getProperties(definedProps);

        for (var key in object.__dbrefs__) json[key] = object.__dbrefs__[key];

        return json;
    },

    unmarshallModel: function(json, object) {
        var definedProps = object.getMetadata().definedProperties;
        var stdPropsValues = {};

        object.beginPropertyChanges();
        for (var key in json) {
            if (!definedProps.hasOwnProperty(key)) continue;

            var value = json[key];
            var propDef = definedProps[key];

            if (propDef.isAssociation === true && propDef.type === Syrah.HasMany && value instanceof Array) {
                var assocType = (Ember.typeOf(propDef.itemType) === 'string') ? Ember.getPath(propDef.itemType) : propDef.itemType;
                value.forEach(function(hash) {
                    // TODO : use replaceContent() or something like that
                    object.get(key).pushObject(this.unmarshallModel(hash, assocType.create()));
                }, this);
            } else {
                stdPropsValues[key] = value;
            }
        }
        object.setProperties(stdPropsValues);
        object.endPropertyChanges();
        return object;
    },

    // WARNING : this doesn't work in IE8... (*ALL* object properties are marshalled...)
    marshallSimpleObject: function(object) {
        var v, attrs = [];

        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
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

        return json;
    },
	
	unmarshallSimpleObject: function(json, object) {
		var props = {};
		for (var k in json) {
			v = json[k];
			if (v instanceof Array) {
				props[k] = Ember.A([]);
				var assocType = Syrah.Inflector.guessAssociationType(k, object.constructor);
                if (assocType === undefined) assocType = Ember.Object;
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
	}
});