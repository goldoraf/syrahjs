Syrah.Model = Ember.Object.extend({

	id: Ember.computed(function(key, value) {
	    var pk = this.getPrimaryKey();
	
	    if (arguments.length === 2) {
	        this.setDbRef(pk, value);
	        return value;
	    }
	
	    return this.getDbRef(pk);
	}).property()

});

Syrah.Model.reopenClass({
    define: function(schema) {
        var properties = {};
        var propertiesMeta = {};
        var primaryKey = 'id';

        if (schema.hasOwnProperty('primaryKey')) {
            primaryKey = schema.primaryKey;
            delete schema.primaryKey;
        }

        for (var propertyName in schema) {
            if (schema.hasOwnProperty(propertyName)) {
                var propertyDef = expandPropertyDefinition(propertyName, schema[propertyName]);
                propertiesMeta[propertyName] = propertyDef;
                var defaultValue = propertyDef.defaultValue || null;
                if (propertyDef.isAssociation === true) {
                    properties[propertyName] = Ember.computed(function(key, value) {
                        var assoc = this.getAssociationObject(key);
                        if (arguments.length === 2) {
                            assoc.replaceTarget(value);
                            return value;
                        }
                        if (assoc.constructor === Syrah.HasManyCollection) {
                            return assoc;
                        }
                        return assoc.get('target');
                    }).property();
                } else {
                    properties[propertyName] = defaultValue;
                }
            }
        }

        var klass = this.extend(properties);
        klass.isModel = true;
        klass.__metadata__ = {
            primaryKey: primaryKey,
            definedProperties: propertiesMeta
        };

        return klass;
    },

    create: function(data) {
        var instance = this._super.apply(this, arguments);
        instance.__dbrefs__ = {};
        instance.__associations__ = {};

        var assocs = instance.getAssociations();
        for (var assocName in assocs) {
            var assoc = assocs[assocName];
            var fk = assoc.foreignKey || null;
            var inverseOf = assoc.inverseOf || null;
            
            if (assoc.type === Syrah.HasMany) {
                assocObject = Syrah.HasManyCollection.create({
                    inverseOf: inverseOf,
                    content: [],
                    parentObject: instance,
                    foreignKey: fk
                });
            } else {
                assocObject = Syrah.BelongsTo.create({
                    inverseOf: inverseOf,
                    target: null,
                    owner: instance,
                    foreignKey: fk
                });
            }
            instance.__associations__[assocName] = assocObject;
        }

        return instance;
    },

    getPk: function() {
        return this.__metadata__.primaryKey;
    }
});

Syrah.Model.reopen({
    
    isNew: function() {
        return this.get('id') === undefined;
    },

    getPrimaryKey: function() {
        return this.getMetadata().primaryKey;
    },

    setDbRef: function(key, value) {
        this.__dbrefs__[key] = value;
    },

    getDbRef: function(key) {
        return this.__dbrefs__[key];
    },

    getDbRefsPossibleKeys: function() {
        return [this.getPrimaryKey()];
    },

    getAssociationObject: function(assocName) {
        return this.__associations__[assocName];
    },

    getAssociations: function() {
        var assocs = {};
        var props = this.getMetadata().definedProperties;
        for (var propName in props) {
            if (props[propName].isAssociation) assocs[propName] = props[propName];
        }
        return assocs;
    },

    getPropertyType: function(propertyName) {
        return this.getPropertyDefinition(propertyName).type;
    },

    getPropertyDefault: function(propertyName) {
        return this.getPropertyDefinition(propertyName).defaultValue;
    },

    getPropertyDefinition: function(propertyName) {
        Ember.assert("Property '" + propertyName + "' has not been defined", this.getMetadata().definedProperties.hasOwnProperty(propertyName));
        return this.getMetadata().definedProperties[propertyName];
    },

    getPrimitiveProperties: function() {
        return this.getDefinedProperties().filter(function(item) {
            return !this.getPropertyDefinition(item).isAssociation;
        }, this);
    },

    getDefinedProperties: function() {
        return Ember.keys(this.getMetadata().definedProperties);
    },

    getMetadata: function() {
        return this.constructor.__metadata__;
    },

    duplicate: function(options) {
        options = options || {};
        var duplicateAssocs = options.duplicateAssociations || [];
        var includeAssocs = options.includeAssociations || [];

        var newInstance = this.constructor.create({});
        var data = {};

        //newInstance.beginPropertyChanges();

        var primitiveProps = this.getPrimitiveProperties();
        primitiveProps.forEach(function(propName) {
            data[propName] = this.get(propName);
        }, this);

        newInstance.setProperties(data);

        var filterSubAssocs = function(assocs, parentAssocName) {
            var subAssocs = [];
            var re = new RegExp('^' + parentAssocName + "\.");
            assocs.forEach(function(item) {
                if (item.match(re)) {
                    subAssocs.push(item.replace(re, ''));
                }
            });
            return subAssocs;
        }

        var assocs = this.getAssociations();
        for (var assocName in assocs) {
            if (duplicateAssocs.indexOf(assocName) === -1 && includeAssocs.indexOf(assocName) === -1) continue;
            var assoc = assocs[assocName];
            var subOptions = {
                duplicateAssociations: filterSubAssocs(duplicateAssocs, assocName),
                includeAssociations: filterSubAssocs(includeAssocs, assocName)
            };
            if (assoc.type === Syrah.HasMany) {
                this.get(assocName).forEach(function(item) {
                    if (duplicateAssocs.indexOf(assocName) !== -1) {
                        newInstance.get(assocName).pushObject(item.duplicate(subOptions));
                    } else if (includeAssocs.indexOf(assocName) !== -1) {
                        newInstance.get(assocName).pushObject(item);
                    }
                });
            } else {
                if (duplicateAssocs.indexOf(assocName) !== -1) {
                    newInstance.set(assocName, this.get(assocName).duplicate(subOptions));
                } else if (includeAssocs.indexOf(assocName) !== -1) {
                    newInstance.set(assocName, this.get(assocName));
                }
            }
        }

        //newInstance.endPropertyChanges();
        return newInstance;
    }
});

var expandPropertyDefinition = function(name, definition) {
    if (definition === Number || definition === String || definition === Boolean || definition === Date || definition === Object || definition.isModel === true) {
        definition = { type: definition };
    }
    Ember.assert("A property's definition must have a type", definition.type !== undefined);

    if (definition.type.isModel || typeof(definition.type) == 'string') {
        definition.isAssociation = true;
        if (definition.foreignKey === undefined) {
            definition.foreignKey = Syrah.Inflector.getFkForType(definition.type);
        }
    }

    if (definition.type === Syrah.HasMany) {
        Ember.assert("A HasMany must have an itemType", definition.itemType !== undefined);
        definition.isAssociation = true;
    }
    return definition;
}

