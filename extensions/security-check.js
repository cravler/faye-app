//
module.exports = function(options, bayeux) {
    var request = require('request');
    var url = process.env.FAYE_EXT_SECURITY_CHECK_URL || null;
    var key = process.env.FAYE_EXT_SECURITY_CHECK_KEY || 'security';

    var getServerClientId = function() {
        return bayeux.getClient()._dispatcher.clientId;
    };

    return {
        incoming: function(message, callback) {
            var system = message.clientId == getServerClientId();
            if (!system && url && (message.channel === '/meta/subscribe' || !message.channel.match(/^\/meta\//))) {
                request({
                    url: url,
                    method: 'POST',
                    form: message
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var result = { success: false };
                        try {
                            result = JSON.parse(body.toString('utf-8'));
                        } catch (e) {
                            console.log('[error] JSON.parse: ', e, body.toString('utf-8'));
                        }
                        if (!(result['success'] || false)) {
                            message.error = result['msg'] || '403::Authentication required';
                        }
                        callback(message);
                    }
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