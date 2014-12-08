//
var fs    = require('fs');
var http  = require('http');
var https = require('https');
var faye  = require('faye');

module.exports = function(options) {

    var extend = function(target) {
        var sources = [].slice.call(arguments, 1);
        sources.forEach(function(source) {
            for (var prop in source) {
                target[prop] = source[prop];
            }
        });
        return target;
    };

    var prepareRequire = function(str) {
        return str.replace('./', process.cwd() + '/');
    };

    var defaultOptions = require(__dirname + '/options');
    if (process.env.FAYE_OPTIONS) {
        extend(
            defaultOptions,
            require(prepareRequire(process.env.FAYE_OPTIONS))
        );
    }
    if (fs.existsSync(process.cwd() + '/options.js')) {
        extend(
            defaultOptions,
            require(process.cwd() + '/options')
        );
    }
    options = extend(
        defaultOptions,
        options || {}
    );

    var engine = options['engine'] || null;
    if (typeof engine == 'string') {
        engine = require(prepareRequire(engine))(options);
    }

    var bayeux = new faye.NodeAdapter({
        mount: options['mount'],
        timeout: Number(options['timeout']),
        ping: options['ping'] ? Number(options['ping']) : null,
        engine: engine
    });

    if (options['extensions']) {
        if (typeof options['extensions'] == 'string') {
            options['extensions'] = options['extensions'].split(',');
        }
        options['extensions'].forEach(function(name) {
            if (name.length) {
                bayeux.addExtension(require(prepareRequire(name))(options, bayeux));
            }
        });
    }

    if (options['monitoring'].length) {
        if (typeof options['monitoring'] == 'string') {
            options['monitoring'] = options['monitoring'].split(',');
        }
        options['monitoring'].forEach(function(name) {
            if (name.length) {
                require(prepareRequire(name))(options, bayeux);
            }
        });
    }

    var App = function() {};

    App.prototype.getOptions = function() {
        return options;
    };

    App.prototype.getAdapter = function() {
        return bayeux;
    };

    App.prototype.run = function(requestListener) {

        requestListener = requestListener || options['requestListener'];
        if (typeof requestListener == 'string') {
            requestListener = require(prepareRequire(requestListener))(options);
        }

        var server = options['tls']
                   ? https.createServer({ cert: options['cert'], key: options['key'] }, requestListener)
                   : http.createServer(requestListener);

        bayeux.attach(server);
        server.listen(Number(options['port']));
    };

    return new App();
};