'use strict';

const mout = require('mout');
const nopt = require('nopt');

const isTrue = value => true == value || 'true' == value;

const isFalse = value => false == value || 'false' == value;

const isNumber = value => !isNaN(parseFloat(value)) && isFinite(value);

const readOptions = argv => {
    const parsedOptions = {};

    mout.object.forOwn(nopt({}, {}, argv), (value, key) => {
        parsedOptions[mout.string.camelCase(key)] = isNumber(value) ? Number(value) : value;
    });

    delete parsedOptions.argv;

    return parsedOptions;
};

module.exports = { isTrue, isFalse, isNumber, readOptions };
