'use strict';

// A buggy extension that calls its callback twice makes faye reply twice to the
// same HTTP request, and the second writeHead() throws ERR_HTTP_HEADERS_SENT,
// killing the process. Drop the duplicate reply and log it instead.
//
// FAYE_SERVER_HOOKS=faye-app/hooks/duplicate-response-guard
module.exports = (options, bayeux) => (server) => {
    const listeners = server.listeners('request');
    server.removeAllListeners('request');
    server.on('request', function(request, response) {
        const { writeHead, end } = response;

        let duplicate = false;

        response.writeHead = function(...args) {
            if (this.headersSent) {
                duplicate = true;
                // the default 10 frames stop inside faye, before the code that replied twice
                const stackTraceLimit = Error.stackTraceLimit;
                Error.stackTraceLimit = 50;
                const stack = new Error().stack;
                Error.stackTraceLimit = stackTraceLimit;
                console.error(
                    '[duplicate-response-guard] duplicate response dropped:',
                    request.method,
                    request.url,
                    '\n' + stack
                );
                return this;
            }

            return writeHead.apply(this, args);
        };

        response.end = function(...args) {
            if (duplicate) {
                duplicate = false;
                return this;
            }

            return end.apply(this, args);
        };

        for (const listener of listeners) {
            listener.apply(this, arguments);
        }
    });
};
