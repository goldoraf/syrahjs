Syrah.DataSource = Ember.Object.extend({
	
	all: null,
	find: null,
	findById: null,
	add: null,

    executeCallbacks: function(callbacks, json) {
        callbacks.forEach(function(args) {
            var callback = args.shift();
            var context = args.shift();
            args.push(json);
            callback.apply(context, args);
        });
    },
	
	getCollectionName: function(type) {
		return Syrah.Inflector.getCollectionName(type);
	}
	
});
