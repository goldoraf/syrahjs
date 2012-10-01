Syrah.BelongsTo = Ember.Object.extend({
    target: null,
    owner: null,
    foreignKey: null,

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
    createInstance: function(options, owner) {
        var fk = options.foreignKey || null,
            inverseOf = options.inverseOf || null;

        return Syrah.BelongsTo.create({
            inverseOf: inverseOf,
            target: null,
            owner: owner,
            foreignKey: fk
        });
    },

    getComputedProperty: function() {
        return Ember.computed(function(key, value) {
            var assoc = this.getAssociationObject(key);
            if (arguments.length === 2) {
                assoc.replaceTarget(value);
                return value;
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
            var inverseAssoc = object.getAssociationObject(inverse);
            // TODO : ajouter un check
            inverseAssoc.set('target', this.get('owner'));
        }

        this._super(object);
    },

    replaceTarget: function(value) {
        //this.set('content', value);
    }
});

Syrah.HasMany.reopenClass({
    createInstance: function(options, owner) {
        var fk = options.foreignKey || Syrah.Inflector.getFkForType(owner.constructor),
            inverseOf = options.inverseOf || null;

        return Syrah.HasMany.create({
            inverseOf: inverseOf,
            content: [],
            owner: owner,
            foreignKey: fk
        });
    },

    getComputedProperty: function() {
        return Ember.computed(function(key, value) {
            return this.getAssociationObject(key);
        }).property();
    }
})