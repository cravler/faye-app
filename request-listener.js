//
var fs = require('fs');
var mime = require('mime');

module.exports = function(options) {
    return function (request, response) {
        var path = request.url;
        if (request.url === '/') {
            path = '/index.html';
        }
        else if (request.url === '/cert' && options['tls']) {
            path = options['cert'];
        }
        fs.readFile(options['publicDir'] + path, function (err, content) {
            var status = err ? 404 : 200;
            try {
                response.writeHead(status, {'Content-Type': mime.lookup(path)});
                response.end(content || 'Not found');
            } catch (e) {}
        });
    };
};