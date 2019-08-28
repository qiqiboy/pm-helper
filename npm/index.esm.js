if (process.env.NODE_ENV === 'production') {
    module.exports = require('./pmer.esm.production.js');
} else {
    module.exports = require('./pmer.esm.development.js');
}
