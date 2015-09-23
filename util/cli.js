//
var mout = require('mout');
var nopt = require('nopt');

var isTrue = function(value) {
    if (true == value) {
        return true;
    } else if ('true' == value) {
        return true;
    }
    return false;
};

var isFalse = function(value) {
    if (false == value) {
        return true;
    } else if ('false' == value) {
        return true;
    }
    return false;
};

var isNumber = function(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

var readOptions = function(argv) {
    var parsedOptions = {};
    var noptOptions = nopt({}, {}, argv);
    mout.object.forOwn(noptOptions, function (value, key) {
        parsedOptions[mout.string.camelCase(key)] = isNumber(value) ? Number(value) : value;
    });

    delete parsedOptions.argv;

    return parsedOptions;
};

module.exports = {
    isTrue: isTrue,
    isFalse: isFalse,
    isNumber: isNumber,
    readOptions: readOptions
};