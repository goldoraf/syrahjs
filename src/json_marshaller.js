Syrah.JSONMarshaller = Ember.Object.extend({
	
	marshall: function(object, options) {
		var options = options || {};
        if (object instanceof Syrah.Model) return this.marshallModel(object, options.embedded);
        return this.marshallSimpleObject(object);
	},

    unmarshall: function(json, object) {
        if (object instanceof Syrah.Model) return this.unmarshallModel(json, object);
        return this.unmarshallSimpleObject(json, object);
    },

    marshallModel: function(object, embedded) {
        var primitiveProps = object.getPrimitiveProperties();
        var embeddedAssocs = embedded || [];

        var data = object.getProperties(primitiveProps);

        var definedProps = object.getMetadata().definedProperties;

        for (var propName in data) {
            var type = definedProps[propName].type;
            var typecast = Syrah.typecastFor(type);
            if (typecast !== undefined) {
                data[propName] = typecast.toJson(data[propName]);
            }
        }

        var filterSubEmbeddedAssocs = function(parentAssocName) {
            var subEmbeddedAssocs = [];
            var re = new RegExp('^' + parentAssocName + "\.");
            embeddedAssocs.forEach(function(item) {
                if (item.match(re)) {
                    subEmbeddedAssocs.push(item.replace(re, ''));
                }
            });
            return subEmbeddedAssocs;
        }

        var assocs = object.getAssociations();
        for (var assocName in assocs) {
            if (embeddedAssocs.indexOf(assocName) === -1) continue;

            var propDef = definedProps[assocName];
            if (propDef.type === Syrah.HasMany) {
                var value = [];
                object.get(assocName).get('content').forEach(function(item) {
                    value.push(this.marshallModel(item, filterSubEmbeddedAssocs(assocName)));
                }, this);
                data[assocName] = value;
            } else {
                data[assocName] = this.marshallModel(object.get(assocName), filterSubEmbeddedAssocs(assocName));
            }
        }

        for (var key in object.__dbrefs__) data[key] = object.__dbrefs__[key];

        return data;
    },

    unmarshallModel: function(json, object) {
        var definedProps = object.getMetadata().definedProperties;
        var dbRefsPossibleKeys = object.getDbRefsPossibleKeys();
        var stdPropsValues = {};

        object.beginPropertyChanges();
        for (var key in json) {
            var value = json[key];

            if (dbRefsPossibleKeys.indexOf(key) !== -1) {
                object.setDbRef(key, value);
            }

            if (!definedProps.hasOwnProperty(key)) continue;

            var propDef = definedProps[key];

            if (propDef.isAssociation === true) {
                if (propDef.type === Syrah.HasMany && value instanceof Array) {
                    var assocType = (Ember.typeOf(propDef.itemType) === 'string') ? Ember.get(propDef.itemType) : propDef.itemType;
                    value.forEach(function(hash) {
                        // TODO : use replaceContent() or something like that
                        object.get(key).pushObject(this.unmarshallModel(hash, assocType.create()));
                    }, this);
                } else if (value instanceof Object) {
                    var assocType = (Ember.typeOf(propDef.type) === 'string') ? Ember.get(propDef.type) : propDef.type;
                    object.set(key, this.unmarshallModel(value, assocType.create()))
                }
            } else {
                var typecast = Syrah.typecastFor(propDef.type);
                if (typecast !== undefined) {
                    value = typecast.fromJson(value);
                }
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
