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
    if (definition === Number || definition === String || definition === Boolean || definition === Date || definition === Object) {
        definition = { type: definition };
    }
    Ember.assert("A property's definition must have a type", definition.type !== undefined);

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
        klass.__metadata__ = {
            primaryKey: primaryKey,
            definedProperties: propertiesMeta
        };

        return klass;
    },

    create: function(data) {
        var instance = this._super.apply(this, arguments);
        instance.__dbrefs__ = {};

        return instance;
    }
});

Syrah.Model.reopen({
    getPrimaryKey: function() {
        return this.getMetadata().primaryKey;
    },

    setDbRef: function(key, value) {
        this.__dbrefs__[key] = value;
    },

    getDbRef: function(key) {
        return this.__dbrefs__[key];
    },

    getPropertyType: function(propertyName) {
        return this.getPropertyDefinition(propertyName).type;
    },

    getPropertyDefinition: function(propertyName) {
        Ember.assert("Property '" + propertyName + "' has not been defined", this.getMetadata().definedProperties.hasOwnProperty(propertyName));
        return this.getMetadata().definedProperties[propertyName];
    },

    getDefinedProperties: function() {
        return Ember.keys(this.getMetadata().definedProperties);
    },

    getMetadata: function() {
        return this.constructor.__metadata__;
    }
});

Syrah.HasMany = Ember.Object.extend({});

Syrah.HasMany.getComputedProperty = function(options) {
    var fk = options.foreignKey || null;

    return Ember.computed(function(key, value) {
        return Syrah.HasManyCollection.create({
            parentObject: this,
            foreignKey: fk
        });
    }).property().cacheable();
}

/*Syrah.belongsTo = function(type, options) {
    return Ember.computed(function(key, value) {
        if (arguments.length === 2) {
            options = options || {};
            var fk = options.foreignKey || Syrah.Inflector.getFkForType(type);
            this.set(fk, value.get('id'));
            return value;
        } else {
            return null;
        }
    }).property().cacheable();
}*/

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
        object.set(fk, this.get('parentObject').get('id'));
        this._super(object);
    }
});
