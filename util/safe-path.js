'use strict';

const path = require('path');

// Resolves a request URL against `root`; returns null if it escapes `root`.
module.exports = (root, url) => {
    let pathname;
    try {
        pathname = decodeURIComponent(url.split(/[?#]/)[0]);
    } catch (e) {
        return null;
    }

    if (pathname.includes('\0')) {
        return null;
    }

    const base = path.resolve(root);
    const target = path.resolve(base, '.' + path.posix.normalize('/' + pathname));

    return target === base || target.startsWith(base + path.sep) ? target : null;
};
