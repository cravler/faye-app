var mout = require('mout');
var nopt = require('nopt');

var isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};

function readOptions(argv) {
    var parsedOptions = {};
    var noptOptions = nopt({}, {}, argv);
    mout.object.forOwn(noptOptions, function (value, key) {
        parsedOptions[mout.string.camelCase(key)] = isNumber(value) ? Number(value) : value;
    });

    delete parsedOptions.argv;

    return parsedOptions;
}

module.exports.readOptions = readOptions;