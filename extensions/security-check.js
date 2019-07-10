'use strict';

const colors = require('colors/safe');
const request = require('request');
const cli = require('../util/cli');

module.exports = (options, bayeux) => {
    const enabled    = !cli.isFalse(process.env.FAYE_EXT_SECURITY_CHECK_ENABLED);
    const debug      = cli.isTrue(process.env.FAYE_EXT_SECURITY_CHECK_DEBUG);
    const url        = process.env.FAYE_EXT_SECURITY_CHECK_URL || null;
    const key        = process.env.FAYE_EXT_SECURITY_CHECK_KEY || 'security';
    const tokenKey   = process.env.FAYE_EXT_SECURITY_CHECK_TOKEN || 'system';
    const headersKey = process.env.FAYE_EXT_SECURITY_CHECK_HEADERS || 'headers';
    const cacheTTL   = process.env.FAYE_EXT_SECURITY_CHECK_CACHE_TTL || 5;
    const cache      = {};
    const timeouts   = {};

    if (!enabled) {
        console.warn('[security-check] disabled');
        return {};
    }

    let tokenValue = null;

    const info = (...args) => debug && console.info(...args);
    const dump = obj => JSON.stringify(obj, null, 4);
    const getServerClientId = () => bayeux.getClient()._dispatcher.clientId;
    const getToken = (message) => {
        if (tokenKey) {
            if (message.ext && message.ext[key] && message.ext[key][tokenKey]) {
                return message.ext[key][tokenKey];
            }
        }
        return null;
    };
    const hasToken = (message) => {
        if (tokenValue) {
            return tokenValue == getToken(message);
        }
        return false;
    };

    bayeux.on('disconnect', clientId => {
        if (clientId in timeouts) {
            info('[security-check] clear timeouts[%s]', clientId);
            for (let timeout of timeouts[clientId]) {
                clearTimeout(timeout);
            }
            delete timeouts[clientId];
        }

        if (clientId in cache) {
            info('[security-check] clear cache[%s]', clientId);
            delete cache[clientId];
        }
    });

    return {
        incoming: (message, callback) => {
            const system = message.clientId == getServerClientId();
            if (!system && url && (message.channel === '/meta/subscribe' || !message.channel.match(/^\/meta\//))) {
                if (hasToken(message)) {
                    info('[security-check] has token:', '\n' + colors.white(tokenValue));
                    callback(message);
                    return;
                }

                let channel = message['channel'];
                if (message['channel'] === '/meta/subscribe') {
                    channel = message['subscription'];
                }
                const clientId = message.clientId;
                if (clientId in cache && channel in cache[clientId]) {
                    const { data = null, ext = null } = message;
                    const index = cache[clientId][channel].indexOf(JSON.stringify({ data, ext }));
                    if (-1 !== index) {
                        info('[security-check] in cache[%s][%s]:', clientId, channel, '\n' + colors.white(dump({ data, ext })));
                        callback(message);
                        return;
                    }
                }

                info('[security-check] make request:', url, '\n' + dump(message));

                request({
                    url,
                    method: 'POST',
                    headers: message.ext[headersKey] || {},
                    form: message
                }, (error, response, body) => {
                    let result = { success: false, cache: false };
                    if (!error && response.statusCode == 200) {
                        try {
                            result = JSON.parse(body.toString('utf-8'));
                        } catch (e) {
                            console.error('[security-check] JSON.parse:\n', e, body.toString('utf-8'));
                        }
                        if (!(result['success'] || false)) {
                            message.error = result['msg'] || '403::Authentication required';
                        }
                    } else {
                        message.error = '500::Internal Server Error';
                        console.error(
                            '[security-check] request[error]:', url,
                            '\n' + dump(message),
                            '\n' + error,
                            '\n' + response ? response.statusCode : null
                        );
                    }

                    info('[security-check] request[%s]:', result['success'] ? 'success' : 'failure', url, '\n' + dump(message));

                    if (result['success']) {
                        let token = getToken(message);
                        if (token && !tokenValue) {
                            info('[security-check] set token:', colors.white(token));
                            tokenValue = token;
                        } else if (clientId && result['cache'] || false) {
                            if (true === result['cache']) {
                                result['cache'] = cacheTTL;
                            }

                            if (!(clientId in cache)) {
                                cache[clientId] = {};
                            }

                            if (!(channel in cache[clientId])) {
                                cache[clientId][channel] = [];
                            }

                            const { data = null, ext = null } = message;

                            info('[security-check] add to cache[%s][%s]: ', clientId, channel, '\n' + colors.white(dump({ data, ext })));
                            cache[clientId][channel].push(JSON.stringify({ data, ext }));

                            if (!(clientId in timeouts)) {
                                timeouts[clientId] = [];
                            }

                            const timeout = setTimeout(function() {
                                if (clientId in cache && channel in cache[clientId]) {
                                    const index = cache[clientId][channel].indexOf(JSON.stringify({ data, ext }));
                                    if (-1 !== index) {
                                        info('[security-check] remove from cache[%s][%s]: ', clientId, channel, '\n' + colors.white(dump({ data, ext })));
                                        cache[clientId][channel].splice(index, 1);
                                    }
                                }

                                const index = timeouts[clientId].indexOf(timeout);
                                if (-1 !== index) {
                                    info('[security-check] remove from timeouts[%s]', clientId);
                                    timeouts[clientId].splice(index, 1);
                                }
                            }, result['cache'] * 1000);

                            timeouts[clientId].push(timeout);
                        }
                    }

                    callback(message);
                });
            } else {
                callback(message);
            }
        },
        outgoing: (message, callback) => {
            if (message.ext) {
                delete message.ext[key];
            }
            callback(message);
        }
    };
};
