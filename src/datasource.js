Syrah.DataSource = Ember.Object.extend({
	
	all: null,
	find: null,
	findById: null,
	add: null,

    executeCallbacks: function(callbacks) {
        var passedArguments = arguments;
        callbacks.forEach(function(args) {
            var callback = args.shift();
            var context = args.shift();
            for (var i = 1; i < passedArguments.length; i++) { args.push(passedArguments[i]); }
            callback.apply(context, args);
        }, this);
    },
	
	getCollectionName: function(type) {
		return Syrah.Inflector.getCollectionName(type);
	}
	
});
