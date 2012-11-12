Syrah.Store = Ember.Object.extend({
	
	ds: null,

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

                    object.set(key, value.map(function(hash) {
                        return this.unmarshallModel(hash, assocType.create());
                    }, this));

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
        object.set("isLoaded", true);
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
    },

    save: function(object, options) {
        if (object.isNew()) {
            return this.add(object, options);
        }
        return this.update(object, options);
    },
	
	add: function(object, options) {
        options = options || {};
        var embedded = options.embedded || [];
        var successCallbacks = this.prepareCallbacks([this.didAddObject, this, object, embedded], options, 'success');
        var errorCallbacks   = this.prepareCallbacks([this.didError, this, object], options, 'error');
        this.get('ds').add(object.constructor, this.toJSON(object, options), successCallbacks, errorCallbacks);
		return object;
	},
	
	update: function(object, options) {
        options = options || {};
        var successCallbacks = this.prepareCallbacks([this.didUpdateObject, this, object], options, 'success');
        var errorCallbacks   = this.prepareCallbacks([this.didError, this, object], options, 'error');
        this.get('ds').update(object.constructor, this.toJSON(object, options), successCallbacks, errorCallbacks);
		return object;
	},
	
	destroy: function(object, options) {
        options = options || {};
        var successCallbacks = this.prepareCallbacks([this.didDestroyObject, this, object], options, 'success');
        var errorCallbacks   = this.prepareCallbacks([this.didError, this, object], options, 'error');
		this.get('ds').destroy(object.constructor, this.toJSON(object, options), successCallbacks, errorCallbacks);
		return;
	},
	
	find: function(type, query) {
		if (query === undefined) {
			return this.all(type);
		} else {
            var collection = this.newCollection();
            this.get('ds').find(type, collection, query, this.loadMany, this);
            return collection;
        }
	},
	
	findById: function(type, id) {
		var object = type.create();
		this.get('ds').findById(type, object, id, this.load, this);
		return object;
	},
	
	all: function(type) {
        var collection = this.newCollection();
		this.get('ds').all(type, collection, this.loadMany, this);
		return collection;
	},

    lazyMany: function(parentType, parentId, itemType, collection) {
        this.get('ds').lazyMany(parentType, parentId, itemType, collection, this.loadMany, this);
        return collection;
    },

    lazyOne: function(parentType, parentId, itemType, object) {
        this.get('ds').lazyOne(parentType, parentId, itemType, object, this.load, this);
        return object;
    },

    bulk: function() {
        return Syrah.Bulk.create({ store: this });
    },
	
	loadMany: function(type, collection, data) {
        collection.beginPropertyChanges();
		data.forEach(function(hash) {
            collection.push(this.load(type.create(), hash));
		}, this);
        collection.set('isLoaded', true);
        collection.endPropertyChanges();
        return collection;
	},
	
	load: function(object, json) {
		return this.unmarshall(json, object);
	},

    newCollection: function() {
        var coll = Ember.A([]);
        coll.set('isLoaded', false);
        return coll;
    },
	
	didAddObject: function(object, embedded, json) {
		// The DS must provide an ID for the newly created object in the returned JSON
        var pk = object.hasOwnProperty('getPrimaryKey') ? object.getPrimaryKey() : 'id';
        if (json[pk] === undefined) {
            throw "The DataSource has not provided an ID for the newly created object";
        }
        id = json[pk];
		object.set('id', id);

        if (embedded.length !== 0) {
            this.didAddEmbeddedObjects(object, embedded, json);
        }

		return object;
	},

    didAddEmbeddedObjects: function(object, embedded, json) {
        var assocs = object.getAssociations();
        var definedProps = object.getMetadata().definedProperties;

        var filterSubEmbeddedAssocs = function(parentAssocName) {
            var subEmbeddedAssocs = [];
            var re = new RegExp('^' + parentAssocName + "\.");
            embedded.forEach(function(item) {
                if (item.match(re)) {
                    subEmbeddedAssocs.push(item.replace(re, ''));
                }
            });
            return subEmbeddedAssocs;
        }

        for (var assocName in assocs) {
            if (embedded.indexOf(assocName) === -1) continue;

            if (json[assocName] === undefined) {
                throw "The DataSource has not provided a JSON value (with IDs) for the newly created '"+assocName+"' embedded object(s)";
            }

            var propDef = definedProps[assocName];
            if (propDef.type === Syrah.HasMany) {
                object.get(assocName).get('content').forEach(function(item, index) {
                    this.didAddObject(item, filterSubEmbeddedAssocs(assocName), json[assocName][index]);
                }, this);
            } else {
                this.didAddObject(item, filterSubEmbeddedAssocs(assocName), json[assocName]);
            }
        }
    },
	
	didUpdateObject: function(object, json) {
		
	},
	
	didDestroyObject: function(object) {
		object.destroy();
	},

    didAddObjects: function(objects, json) {
        json.forEach(function(item, index) {
            this.didAddObject(objects[index], [], item);
        }, this);
    },

    didUpdateObjects: function(objects, json) {

    },

    didDestroyObjects: function(objects) {
        objects.forEach(function(object) {
            this.didDestroyObject(object);
        }, this);
    },

    didError: function(object, error) {
        // TODO : do something smart here...
    },
	
	toJSON: function(object, options) {
		return this.marshall(object, options);
	},

    prepareCallbacks: function(firstCallback, options, optionKey) {
        options = options || {};
        var callbacks = [];
        callbacks.push(firstCallback);
        if (options[optionKey] !== undefined && options[optionKey] instanceof Array) {
            callbacks.push(options[optionKey]);
        }
        return callbacks;
    }
});
