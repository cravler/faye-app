//
module.exports = function(options, bayeux) {
    var cli     = require('../util/cli');
    var console = require('../util/console');

    var enabled = !cli.isFalse(process.env.FAYE_EXT_PUSH_ONLY_SERVERS_ENABLED);
    var key     = process.env.FAYE_EXT_PUSH_ONLY_SERVERS_KEY || 'password';
    var secret  = process.env.FAYE_EXT_PUSH_ONLY_SERVERS_PASSWORD || 'ThisPasswordIsNotSoSecretChangeIt';

    if (!enabled) {
        console.warn('[push-only-servers] disabled');
        return {};
    }

    return {
        incoming: function(message, callback) {
            if (!message.channel.match(/^\/meta\//)) {
                var password = message.ext && message.ext[key];
                if (password !== secret) {
                    message.error = '403::Password required';
                }
            }
            callback(message);
        },
        outgoing: function(message, callback) {
            if (message.ext) {
                delete message.ext[key];
            }
            callback(message);
        }
    };
};