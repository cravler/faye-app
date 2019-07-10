'use strict';

const debug = console.warn;
const dump = obj => '\n' + JSON.stringify(obj, null, 4);

module.exports = (options, bayeux) => {
    bayeux.on('handshake', clientId => debug('[debug] handshake:', dump({ clientId })));
    bayeux.on('subscribe', (clientId, channel) => debug('[debug] subscribe:', dump({ clientId, channel })));
    bayeux.on('unsubscribe', (clientId, channel) => debug('[debug] unsubscribe:', dump({ clientId, channel })));
    bayeux.on('publish', (clientId, channel, data) => debug('[debug] publish:', dump({ clientId, channel, data })));
    bayeux.on('disconnect', clientId => debug('[debug] disconnect:', dump({ clientId })));
};
