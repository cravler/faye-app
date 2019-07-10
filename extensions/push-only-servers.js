'use strict';

const cli = require('../util/cli');

module.exports = (options, bayeux) => {
    const enabled = !cli.isFalse(process.env.FAYE_EXT_PUSH_ONLY_SERVERS_ENABLED);
    const key     = process.env.FAYE_EXT_PUSH_ONLY_SERVERS_KEY || 'password';
    const secret  = process.env.FAYE_EXT_PUSH_ONLY_SERVERS_PASSWORD || 'ThisPasswordIsNotSoSecretChangeIt';

    if (!enabled) {
        console.warn('[push-only-servers] disabled');
        return {};
    }

    return {
        incoming: (message, callback) => {
            if (!message.channel.match(/^\/meta\//)) {
                const password = message.ext && message.ext[key];
                if (password !== secret) {
                    message.error = '403::Password required';
                }
            }
            callback(message);
        },
        outgoing: (message, callback) => {
            if (message.ext) {
                delete message.ext[key];
            }
            callback(message);
        }
    };
};
