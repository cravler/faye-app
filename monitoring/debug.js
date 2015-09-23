//
module.exports = function(options, bayeux) {
    var console = require('../util/console');
    var log = function() {
        console.warn.apply(console, arguments);
    };

    bayeux.on('handshake', function(clientId) {
        log('[debug] handshake: ', '\n', {
            clientId: clientId
        });
    });
    bayeux.on('subscribe', function(clientId, channel) {
        log('[debug] subscribe: ', '\n', {
            clientId: clientId,
            channel: channel
        });
    });
    bayeux.on('unsubscribe', function(clientId, channel) {
        log('[debug] unsubscribe: ', '\n', {
            clientId: clientId,
            channel: channel
        });
    });
    bayeux.on('publish', function(clientId, channel, data) {
        log('[debug] publish: ', '\n', {
            clientId: clientId,
            channel: channel,
            data: data
        });
    });
    bayeux.on('disconnect', function(clientId) {
        log('[debug] disconnect: ', '\n', {
            clientId: clientId
        });
    });
};