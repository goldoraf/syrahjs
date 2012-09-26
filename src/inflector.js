Syrah.Inflector = Ember.Object.extend({
	
});

Syrah.Inflector.reopenClass({	
	pluralRules: {
		'(fish)$'                 : '$1$2',       // fish
		'(x|ch|ss|sh)$'           : '$1es',       // search, switch, fix, box, process, address
		'series$'                 : '$1series',
        '([^aeiouy]|qu)ies$'      : '$1y',
        '([^aeiouy]|qu)y$'        : '$1ies',      // query, ability, agency
        '(?:([^f])fe|([lr])f)$'   : '$1$2ves',    // half, safe, wife
        'sis$'                    : 'ses',        // basis, diagnosis
        '([ti])um$'               : '$1a',        // datum, medium
        'person$'                 : 'people',     // person, salesperson
        'man$'                    : 'men',        // man, woman, spokesman
        'child$'                  : 'children',   // child
        '(alias|status)$i'        : '$1es',
        's$'                      : 's',          // no change (compatibility)
        '$'                       : 's'
	},
	
	singularRules: {
		'(f)ish$i'                : '$1$2ish',
        '(x|ch|ss)es$'            : '$1',
        'movies$'                 : 'movie',
        'series$'                 : 'series',
        '([^aeiouy]|qu)ies$'      : '$1y',
        '([lr])ves$'              : '$1f',
        '([^f])ves$'              : '$1fe',
        '(analy|ba|diagno|parenthe|progno|synop|the)ses$' : '$1sis',
        '([ti])a$'                : '$1um',
        'people$'                 : 'person',
        'men$'                    : 'man',
        '(alias|status)es$i'      : '$1',
        'children$'               : 'child',
        'news$'                   : 'news',
        's$'                      : ''
	},
	
	getCollectionName: function(type) {
		return Syrah.Inflector.pluralize(Syrah.Inflector.getTypeName(type));
	},
	
	getTypeName: function(type) {
		var parts = type.toString().split(".");
	    var name = parts[parts.length - 1];
	    return name.underscore();
	},
	
	getTypeNamespace: function(type) {
		return type.toString().split(".")[0];
	},

    getFkForType: function(type) {
        return Syrah.Inflector.getTypeName(type) + '_id';
    },

    guessAssociationType: function(collectionName, parentType) {
        var currentNamespace = Syrah.Inflector.getTypeNamespace(parentType);
        var possibleType = Syrah.Inflector.singularize(collectionName).camelize().ucfirst();

        if (window[currentNamespace] && window[currentNamespace][possibleType]) {
            return window[currentNamespace][possibleType];
        }
        return undefined;
    },
	
	pluralize: function(singular) {
		for (var regexString in Syrah.Inflector.pluralRules) {
			var regex = new RegExp(regexString, 'i');
			if (singular.match(regex)) {
				return singular.replace(regex, Syrah.Inflector.pluralRules[regexString]);
			}
		}
		return singular;
	},
	
	singularize: function(plural) {
		for (var regexString in Syrah.Inflector.singularRules) {
			var regex = new RegExp(regexString, 'i');
			if (plural.match(regex)) {
				return plural.replace(regex, Syrah.Inflector.singularRules[regexString]);
			}
		}
		return plural;
	},
	
	ucfirst: function(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}
});

String.prototype.ucfirst = function() {
    return Syrah.Inflector.ucfirst(this);
};
