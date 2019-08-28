if (process.env.NODE_ENV === 'production') {
    module.exports = require('./pmer.cjs.production.js');
} else {
    module.exports = require('./pmer.cjs.development.js');
}
