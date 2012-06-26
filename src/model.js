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
        definition.observer = function() {
            if (this.get(name) === null) this.setDbRef(definition.foreignKey, null);
            else this.setDbRef(definition.foreignKey, this.get(name).get('id'));
        }
    }

    if (definition.type === Syrah.HasMany) {
        Ember.assert("A HasMany must have an itemType", definition.itemType !== undefined);

        definition.isAssociation = true;
        definition.defaultValue = Syrah.HasMany.getComputedProperty(definition);
    }
    return definition;
}

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
                properties[propertyName] = defaultValue;
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

        // TODO : put this in define()
        var assocs = instance.getAssociations();
        for (var assocName in assocs) {
            if (assocs[assocName].observer) {
                instance.addObserver(assocName, assocs[assocName].observer);
            }
        }

        return instance;
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
    }
});

Syrah.Model.reopenClass({
    getPk: function() {
        return this.__metadata__.primaryKey;
    }
});

Syrah.HasMany = Ember.Object.extend({});

Syrah.HasMany.getComputedProperty = function(options) {
    var fk = options.foreignKey || null;

    return Ember.computed(function(key, value) {
        return Syrah.HasManyCollection.create({
            type: options.type,
            content: [],
            parentObject: this,
            foreignKey: fk
        });
    }).property().cacheable();
}

Syrah.ModelCollection = Ember.ArrayProxy.extend({
    type: null,
    content: []
});

Syrah.HasManyCollection = Syrah.ModelCollection.extend({
    parentObject: null,
    foreignKey: null,

    pushObject: function(object) {
        var fk = this.get('foreignKey');
        if (fk === null) {
            fk = Syrah.Inflector.getFkForType(this.get('parentObject').constructor);
        }
        object.setDbRef(fk, this.get('parentObject').get('id'));
        this._super(object);
    }
});

Syrah.typecastFor = function(type) {
    switch(type) {
        case Date:
            return Syrah.typecasts['date'];
            break;
        default:
            return undefined;
    }
}

Syrah.typecasts = {
    'date' : {
        fromJson: function(value) {
            if (typeof value === 'string' || typeof value === 'number') {
                return new Date(Date.parse(value));
            }
            return null;
        },
        toJson: function(value) {
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        }
    }
}
