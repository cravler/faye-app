'use strict';

const fs = require('fs');
const mime = require('mime');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');

module.exports = (options, bayeux) => {
    let port = options['webDebugPort'] || process.env.FAYE_WEB_DEBUG_PORT || 8080;
    const urlPrefix = options['webDebugUrlPrefix'] || process.env.FAYE_WEB_DEBUG_URL_PREFIX || '';

    port = (port + '').split(':');
    const server = http.createServer((request, response) => {
        let path = (request.url).replace(urlPrefix, '');
        if (path === '/' || path === '') {
            path = '/index.html';
        }

        fs.readFile(__dirname + '/web-debug' + path, (err, content) => {
            const status = err ? 404 : 200;
            if (path == '/index.html' && status == 200) {
                const connectPort = (port.length > 1 ? port[1]: port[0]);
                content = content.toString();
                content = content.replace('[PORT]', (connectPort ? ':' + connectPort : ''));
                content = content.replace('[URL_PREFIX]', urlPrefix);
            }
            try {
                response.writeHead(status, {'Content-Type': mime.getType(path)});
                response.end(content || 'Not found');
            } catch (e) {
                response.end(e.message);
            }
        });
    });
    server.listen(Number(port[0]));

    const wss = new WebSocket.Server({ server });
    wss.broadcast = data => {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        for(let i in this.clients) {
            this.clients[i].send(data);
        }
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    };

    wss.on('connection', ws => {
        ws.on('message', message => {
            const requestMethod = options['tls'] ? https.request : http.request;
            const request = requestMethod({
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

    bayeux.on('handshake', clientId => wss.broadcast({ type: 'handshake', clientId }));
    bayeux.on('subscribe', (clientId, channel) => wss.broadcast({ type: 'subscribe', clientId, channel }));
    bayeux.on('unsubscribe', (clientId, channel) => wss.broadcast({ type: 'unsubscribe', clientId, channel }));
    bayeux.on('publish', (clientId, channel, data) => wss.broadcast({ type: 'publish', clientId, channel, data }));
    bayeux.on('disconnect', clientId => wss.broadcast({ type: 'disconnect', clientId }));
};
