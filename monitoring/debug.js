//
module.exports = function(options, bayeux) {
    var console = require('better-console');

    bayeux.on('handshake', function(clientId) {
        console.warn('[debug] handshake: ');
        console.log(arguments);
    });
    bayeux.on('subscribe', function(clientId, channel) {
        console.warn('[debug] subscribe: ');
        console.log(arguments);
    });
    bayeux.on('unsubscribe', function(clientId, channel) {
        console.warn('[debug] unsubscribe: ');
        console.log(arguments);
    });
    bayeux.on('publish', function(clientId, channel, data) {
        console.warn('[debug] publish: ');
        console.log(arguments);
    });
    bayeux.on('disconnect', function(clientId) {
        console.warn('[debug] disconnect: ');
        console.log(arguments);
    });
};