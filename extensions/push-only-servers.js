//
module.exports = function(options, bayeux) {
    var key = process.env.FAYE_EXT_PUSH_ONLY_SERVERS_KEY || 'password';
    var secret = process.env.FAYE_EXT_PUSH_ONLY_SERVERS_PASSWORD || 'ThisPasswordIsNotSoSecretChangeIt';
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