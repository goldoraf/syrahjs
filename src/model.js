Syrah.Model = Ember.Object.extend({

    primaryKey: 'id',
	id: Ember.computed(function(key, value) {
	    var pk = this.get('primaryKey');
	
	    if (arguments.length === 2) {
	      this.set(pk, value);
	      return value;
	    }
	
	    return this.get(pk);
	}).property('primaryKey')

});

Syrah.Model.reopenClass({
    protectedProperties: []
});

Syrah.hasMany = function(type, options) {

    Ember.set(type, 'protectedProperties', Ember.get(type, 'protectedProperties').pushObject('parentObject'));
    var fk = (options !== undefined && options.foreignKey) ? options.foreignKey : null;

    return Ember.computed(function(key, value) {
        return Syrah.HasManyCollection.create({
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

    pushObject: function(object) {console.log(this.get('parentObject'));
        var fk = this.get('foreignKey');
        if (fk === null) {
            fk = Syrah.Inflector.getFkForType(this.get('parentObject').constructor);
        }
        object.set(fk, this.get('parentObject').get('id'));
        this._super(object);
    }
});
