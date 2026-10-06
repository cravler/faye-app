'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime').default; // mime@4 is ESM-only (default export)
const safePath = require('./util/safe-path');

module.exports = (options) => {
    const root = path.resolve(options['publicDir']);

    return (request, response) => {
        const pathname = request.url.split(/[?#]/)[0];

        let filePath;
        if (pathname === '/cert' && options['tls']) {
            filePath = path.resolve(options['cert']);
        } else {
            filePath = safePath(root, pathname === '/' ? '/index.html' : pathname);
            if (!filePath) {
                response.writeHead(403, { 'Content-Type': 'text/plain' });
                return response.end('Forbidden');
            }
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                response.writeHead(404, { 'Content-Type': 'text/plain' });
                return response.end('Not found');
            }
            response.writeHead(200, {
                'Content-Type': mime.getType(filePath) || 'application/octet-stream'
            });
            response.end(content);
        });
    };
};
