Syrah.Model = Ember.Object.extend({
	
	primaryKey: 'id',
	id: Ember.computed(function(key, value) {
	    var pk = this.get('primaryKey');
	
	    if (arguments.length === 2) {
	      this.set(pk, value);
	      return value;
	    }
	
	    return this.get(pk);
	}).property('primaryKey'),

});
