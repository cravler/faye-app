'use strict';

const fs    = require('fs');
const http  = require('http');
const https = require('https');
const faye  = require('faye');

const prepareRequire = str => str.replace('./', process.cwd() + '/');

const extend = (target, ...sources) => {
    for (let source of sources) {
        for (let prop in source) {
            target[prop] = source[prop];
        }
    }
    return target;
};

module.exports = options => {
    const defaultOptions = require(__dirname + '/options');

    if (process.env.FAYE_OPTIONS) {
        extend(defaultOptions, require(prepareRequire(process.env.FAYE_OPTIONS)));
    }

    if (fs.existsSync(process.cwd() + '/options.js')) {
        extend(defaultOptions, require(process.cwd() + '/options'));
    }

    options = extend(defaultOptions, options || {});

    let engine = options['engine'] || null;
    if (typeof engine == 'string') {
        engine = require(prepareRequire(engine))(options);
    }

    const bayeux = new faye.NodeAdapter({
        mount: options['mount'],
        timeout: Number(options['timeout']),
        ping: options['ping'] ? Number(options['ping']) : null,
        engine: engine
    });

    if (options['extensions']) {
        if (typeof options['extensions'] == 'string') {
            options['extensions'] = options['extensions'].split(',');
        }
        for (let name of options['extensions']) {
            if (name.length) {
                bayeux.addExtension(require(prepareRequire(name))(options, bayeux));
            }
        }
    }

    if (options['monitoring']) {
        if (typeof options['monitoring'] == 'string') {
            options['monitoring'] = options['monitoring'].split(',');
        }
        for (let name of options['monitoring']) {
            if (name.length) {
                require(prepareRequire(name))(options, bayeux);
            }
        }
    }

    class App {
        constructor(options) {
            this.options = options;
        }

        getOptions() {
            return this.options;
        }

        getAdapter() {
            return bayeux;
        }

        run(requestListener) {
            requestListener = requestListener || this.options['requestListener'];
            if (typeof requestListener == 'string') {
                requestListener = require(prepareRequire(requestListener))(this.options);
            }

            const server = this.options['tls']
                ? https.createServer({ cert: this.options['cert'], key:this. options['key'] }, requestListener)
                : http.createServer(requestListener);

            bayeux.attach(server);
            server.listen(Number(this.options['port']));
        }
    }

    return new App(options);
};
