//
module.exports = function(options) {
    return {
        type: require('faye-redis'),
        host: process.env.FAYE_ENGINE_REDIS_HOST || 'localhost',
        port: process.env.FAYE_ENGINE_REDIS_PORT || 6379
    };
};