//
module.exports = function(options, bayeux) {
    bayeux.on('handshake', function(clientId) {
        console.log('[debug] handshake: ', arguments);
    });
    bayeux.on('subscribe', function(clientId, channel) {
        console.log('[debug] subscribe: ', arguments);
    });
    bayeux.on('unsubscribe', function(clientId, channel) {
        console.log('[debug] unsubscribe: ', arguments);
    });
    bayeux.on('publish', function(clientId, channel, data) {
        console.log('[debug] publish: ', arguments);
    });
    bayeux.on('disconnect', function(clientId) {
        console.log('[debug] disconnect: ', arguments);
    });
};