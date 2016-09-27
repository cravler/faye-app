//
module.exports = function(options, bayeux) {
    var request = require('request');
    var cli     = require('../util/cli');
    var console = require('../util/console');

    var enabled    = !cli.isFalse(process.env.FAYE_EXT_SECURITY_CHECK_ENABLED);
    var debug      = cli.isTrue(process.env.FAYE_EXT_SECURITY_CHECK_DEBUG);
    var url        = process.env.FAYE_EXT_SECURITY_CHECK_URL || null;
    var key        = process.env.FAYE_EXT_SECURITY_CHECK_KEY || 'security';
    var tokenKey   = process.env.FAYE_EXT_SECURITY_CHECK_TOKEN || 'system';
    var tokenValue = null;
    var headersKey = process.env.FAYE_EXT_SECURITY_CHECK_HEADERS || 'headers';
    var cacheTTL   = process.env.FAYE_EXT_SECURITY_CHECK_CACHE_TTL || 5;
    var cache      = {};
    var timeouts   = {};

    if (!enabled) {
        console.warn('[security-check] disabled');
        return {};
    }

    var log = function() {
        if (debug) {
            console.info.apply(console, arguments);
        }
    };

    var getServerClientId = function() {
        return bayeux.getClient()._dispatcher.clientId;
    };

    var getToken = function(message) {
        if (tokenKey) {
            if (message.ext && message.ext[key] && message.ext[key][tokenKey]) {
                return message.ext[key][tokenKey];
            }
        }
        return null;
    };

    var hasToken = function(message) {
        if (tokenValue) {
            return tokenValue == getToken(message);
        }
        return false;
    };

    bayeux.on('disconnect', function(clientId) {
        if (clientId in timeouts) {
            log(
                '[security-check] clear timeouts[%s]',
                clientId
            );
            timeouts[clientId].forEach(function(timeout) {
                clearTimeout(timeout);
            });
            delete timeouts[clientId];
        }

        if (clientId in cache) {
            log(
                '[security-check] clear cache[%s]',
                clientId
            );
            delete cache[clientId];
        }
    });

    return {
        incoming: function(message, callback) {
            var system = message.clientId == getServerClientId();
            if (!system && url && (message.channel === '/meta/subscribe' || !message.channel.match(/^\/meta\//))) {
                if (hasToken(message)) {
                    log(
                        '[security-check] has token: ',
                        '\n',
                        tokenValue.white
                    );
                    callback(message);
                    return;
                }

                var clientId = message.clientId;
                var channel = message['channel'];
                if (message['channel'] === '/meta/subscribe') {
                    channel = message['subscription'];
                }
                if (clientId in cache && channel in cache[clientId]) {
                    var data = JSON.stringify({
                        data: message['data'] || null,
                        ext: message['ext'] || null
                    });
                    var index = cache[clientId][channel].indexOf(data);
                    if (-1 !== index) {
                        log(
                            '[security-check] in cache[%s][%s]: ',
                            clientId,
                            channel,
                            '\n',
                            data.white
                        );
                        callback(message);
                        return;
                    }
                }

                log(
                    '[security-check] make request: ',
                    url,
                    '\n',
                    message
                );

                request({
                    url: url,
                    method: 'POST',
                    headers: message.ext[headersKey] || {},
                    form: message
                }, function(error, response, body) {
                    var result = { success: false, cache: false };
                    if (!error && response.statusCode == 200) {
                        try {
                            result = JSON.parse(body.toString('utf-8'));
                        } catch (e) {
                            console.error(
                                '[security-check] JSON.parse: ',
                                '\n',
                                e, body.toString('utf-8')
                            );
                        }
                        if (!(result['success'] || false)) {
                            message.error = result['msg'] || '403::Authentication required';
                        }
                    } else {
                        message.error = '500::Internal Server Error';
                        console.error(
                            '[security-check] request[error]: ',
                            url,
                            '\n',
                            message,
                            '\n',
                            error,
                            '\n',
                            response ? response.statusCode : null
                        );
                    }

                    log(
                        '[security-check] request[%s]: ',
                        result['success'] ? 'success' : 'failure',
                        url,
                        '\n',
                        message
                    );

                    if (result['success']) {
                        var token = getToken(message);
                        if (token && !tokenValue) {
                            log(
                                '[security-check] set token: ',
                                '\n',
                                token.white
                            );
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

                            var data = JSON.stringify({
                                data: message['data'] || null,
                                ext: message['ext'] || null
                            });

                            log(
                                '[security-check] add to cache[%s][%s]: ',
                                clientId,
                                channel,
                                '\n',
                                data.white
                            );
                            cache[clientId][channel].push(data);

                            if (!(clientId in timeouts)) {
                                timeouts[clientId] = [];
                            }

                            var timeout = setTimeout(function() {
                                if (clientId in cache && channel in cache[clientId]) {
                                    var index = cache[clientId][channel].indexOf(data);
                                    if (-1 !== index) {
                                        log(
                                            '[security-check] remove from cache[%s][%s]: ',
                                            clientId,
                                            channel,
                                            '\n',
                                            data.white
                                        );
                                        cache[clientId][channel].splice(index, 1);
                                    }
                                }

                                var index = timeouts[clientId].indexOf(timeout);
                                if (-1 !== index) {
                                    log(
                                        '[security-check] remove from timeouts[%s]',
                                        clientId
                                    );
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
        outgoing: function(message, callback) {
            if (message.ext) {
                delete message.ext[key];
            }
            callback(message);
        }
    };
};