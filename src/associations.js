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
            if (inverseAssoc.constructor === Syrah.HasManyCollection) {
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

Syrah.HasMany = Ember.Object.extend({});

Syrah.HasManyCollection = Ember.ArrayProxy.extend({
    type: null,
    content: [],
    parentObject: null,
    foreignKey: null,

    // TODO : rename/refacto ?
    pushInverseInstance: function(object) {
        Ember.ArrayProxy.prototype.pushObject.call(this, object);
    },

    pushObject: function(object) {
        var fk = this.get('foreignKey');
        if (fk === null) {
            fk = Syrah.Inflector.getFkForType(this.get('parentObject').constructor);
        }
        var parentId = this.get('parentObject').get('id');
        if (!Ember.none(parentId)) { 
            object.setDbRef(fk, parentId);
        }
        var inverse = this.get('inverseOf');
        if (inverse !== null) {
            var inverseAssoc = object.getAssociationObject(inverse);
            // TODO : ajouter un check
            inverseAssoc.set('target', this.get('parentObject'));
        }

        this._super(object);
    },

    replaceTarget: function(value) {
        //this.set('content', value);
    }
});