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