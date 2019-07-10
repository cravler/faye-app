'use strict';

const fs = require('fs');
const mime = require('mime');

module.exports = (options) => (request, response) => {
    let path = request.url;
    if (request.url === '/') {
        path = '/index.html';
    } else if (request.url === '/cert' && options['tls']) {
        path = options['cert'];
    }

    fs.readFile(options['publicDir'] + path, (err, content) => {
        const status = err ? 404 : 200;
        try {
            response.writeHead(status, {'Content-Type': mime.getType(path)});
            response.end(content || 'Not found');
        } catch (e) {}
    });
};
