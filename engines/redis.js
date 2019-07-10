'use strict';

const redis = require('faye-redis');
const engine = redis.prototype;

module.exports = options => ({
    type: redis,
    socket: process.env.FAYE_ENGINE_REDIS_SOCKET,
    host: process.env.FAYE_ENGINE_REDIS_HOST || engine.DEFAULT_HOST,
    port: process.env.FAYE_ENGINE_REDIS_PORT || engine.DEFAULT_PORT,
    password: process.env.FAYE_ENGINE_REDIS_PASSWORD,
    database: process.env.FAYE_ENGINE_REDIS_DATABASE || engine.DEFAULT_DATABASE,
    namespace: process.env.FAYE_ENGINE_REDIS_NAMESPACE,
    gc: process.env.FAYE_ENGINE_REDIS_SOCKET || engine.DEFAULT_GC
});
