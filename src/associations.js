Syrah.BelongsTo = Ember.Object.extend({
    target: null,
    owner: null,
    foreignKey: null,
    isLoaded: false,

    replaceTarget: function(object) {
        this.set('target', object);
        this.replaceForeignKey(object);
        
        var inverse = this.get('inverseOf');
        if (inverse !== null) {
            var inverseAssoc = object.getAssociationObject(inverse);
            if (inverseAssoc.constructor === Syrah.HasMany) {
                inverseAssoc.pushInverseInstance(this.get('owner'));
            } else {
                inverseAssoc.set('target', this.get('owner'));
            }
        }
    },

    replaceForeignKey: function(object) {
        if (object !== null && !Ember.none(object.get('id'))) {
            this.get('owner').setDbRef(this.get('foreignKey'), object.get('id'));
        }
    }
});

Syrah.BelongsTo.reopenClass({
    createInstance: function(options, owner, target) {
        var fk = options.foreignKey || null,
            inverseOf = options.inverseOf || null;

        return Syrah.BelongsTo.create({
            inverseOf: inverseOf,
            target: target,
            owner: owner,
            foreignKey: fk,
            isLoaded: (target !== undefined)
        });
    },

    getComputedProperty: function() {
        return Ember.computed(function(key, value) {
            var assoc = this.getAssociationObject(key);
            if (arguments.length === 2) {
                assoc.replaceTarget(value);
                return value;
            }
            if (assoc.get('isLoaded') === false) {
                var itemType = this.getPropertyDefinition(key).type,
                    target;
                itemType = (Ember.typeOf(itemType) === 'string') ? Ember.get(itemType) : itemType;
                target = itemType.create();

                itemType.getStore().lazyOne(this.constructor, this.get("id"), itemType, target);
                assoc.set('target', target); // ou assoc.replaceTarget(target);????
                return target;
            }
            return assoc.get('target');
        }).property();
    }
});

Syrah.HasMany = Ember.ArrayProxy.extend({
    type: null,
    content: [],
    owner: null,
    foreignKey: null,
    isLoaded: null,

    // TODO : rename/refacto ?
    pushInverseInstance: function(object) {
        Ember.ArrayProxy.prototype.pushObject.call(this, object);
    },

    pushObject: function(object) {
        var parentId = this.get('owner').get('id');
        if (!Ember.none(parentId)) { 
            object.setDbRef(this.get('foreignKey'), parentId);
        }
        var inverse = this.get('inverseOf');
        if (inverse !== null) {
            var inverseAssoc = object.getAssociationObject(inverse, this.get("owner"));
            // TODO : ajouter un check
        }

        this._super(object);
    },

    replaceTarget: function(value) {
        //this.set('content', value);
    },

    getItemType: function(key) {
        var itemType = this.get("owner").getPropertyDefinition(key).itemType;
        itemType = (Ember.typeOf(itemType) === 'string') ? Ember.get(itemType) : itemType;
        return itemType;
    }
});

Syrah.HasMany.reopenClass({
    createInstance: function(options, owner, initialData) {
        var fk = options.foreignKey || Syrah.Inflector.getFkForType(owner.constructor),
            inverseOf = options.inverseOf || null,
            content = initialData || [],
            isLoaded = (initialData !== undefined);

        return Syrah.HasMany.create({
            inverseOf: inverseOf,
            content: content,
            owner: owner,
            foreignKey: fk,
            isLoaded: isLoaded
        });
    },

    getComputedProperty: function() {
        return Ember.computed(function(key, value) {
            if (arguments.length === 2) {
                return this.getAssociationObject(key, value);
            }
            var result = this.getAssociationObject(key);
            if (result.get("isLoaded") === false) {
                var itemType = result.getItemType(key),
                    parent = result.get("owner");

                itemType.getStore().lazyMany(parent.constructor, parent.get("id"), itemType, result);
            }
            return result;
        }).property();
    }
});