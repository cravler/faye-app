//
var WebSocketServer = require('ws').Server;
var http = require('http');
var https = require('https');
var fs = require('fs');
var mime = require('mime');

module.exports = function(options, bayeux) {

    var port = options['webDebugPort'] || process.env.FAYE_WEB_DEBUG_PORT || 8080;
    var urlPrefix = options['webDebugUrlPrefix'] || process.env.FAYE_WEB_DEBUG_URL_PREFIX || '';

    port = (port + '').split(':');
    var server = http.createServer(function(request, response) {
        var path = (request.url).replace(urlPrefix, '');
        if (path === '/' || path === '') {
            path = '/index.html';
        }
        fs.readFile(__dirname + '/web-debug' + path, function(err, content) {
            var status = err ? 404 : 200;
            if (path == '/index.html' && status == 200) {
                var connectPort = (port.length > 1 ? port[1]: port[0]);
                content = content.toString();
                content = content.replace('[PORT]', (connectPort ? ':' + connectPort : ''));
                content = content.replace('[URL_PREFIX]', urlPrefix);
            }
            try {
                response.writeHead(status, {'Content-Type': mime.lookup(path)});
                response.end(content || 'Not found');
            } catch (e) {}
        });
    });
    server.listen(Number(port[0]));

    var wss = new WebSocketServer({server: server});
    wss.broadcast = function broadcast(data) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        for(var i in this.clients) {
            this.clients[i].send(data);
        }
    };
    wss.on('connection', function(ws) {
        ws.on('message', function(message) {
            var requestMethod = options['tls'] ? https.request : http.request;
            var request = requestMethod({
                host: '127.0.0.1',
                port: options['port'],
                path: options['mount'],
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            request.write(message);
            request.end();
        });
    });

    bayeux.on('handshake', function(clientId) {
        wss.broadcast({
            type: 'handshake',
            clientId: clientId
        });
    });
    bayeux.on('subscribe', function(clientId, channel) {
        wss.broadcast({
            type: 'subscribe',
            clientId: clientId,
            channel: channel
        });
    });
    bayeux.on('unsubscribe', function(clientId, channel) {
        wss.broadcast({
            type: 'unsubscribe',
            clientId: clientId,
            channel: channel
        });
    });
    bayeux.on('publish', function(clientId, channel, data) {
        wss.broadcast({
            type: 'publish',
            clientId: clientId,
            channel: channel,
            data: data
        });
    });
    bayeux.on('disconnect', function(clientId) {
        wss.broadcast({
            type: 'disconnect',
            clientId: clientId
        });
    });
};