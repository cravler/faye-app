'use strict';

module.exports = {
    tls: process.env.FAYE_TLS || false,
    key: process.env.FAYE_KEY || null,
    cert: process.env.FAYE_CERT || null,
    port: process.env.FAYE_PORT || 8000,
    mount: process.env.FAYE_MOUNT || '/pub-sub',
    timeout: process.env.FAYE_TIMEOUT || 10,
    ping: process.env.FAYE_PING || null,
    engine: process.env.FAYE_ENGINE || null,
    extensions: process.env.FAYE_EXTENSIONS || null,
    monitoring: process.env.FAYE_MONITORING || null,
    requestListener: process.env.FAYE_REQUEST_LISTENER || null,
    publicDir: process.env.FAYE_PUBLIC_DIR || __dirname + '/public'
};
