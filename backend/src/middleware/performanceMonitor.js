
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e9 + diff[1]) / 1e6;

        // Log performance metrics
        const message = `${req.method} ${req.originalUrl} - ${timeInMs.toLocaleString()} ms`;

        if (timeInMs > 500) { // Threshold for slow requests
            logger.warn(`⚠️ Slow Request: ${message}`);
        } else if (process.env.NODE_ENV === 'development') {
            logger.debug(`🚀 Performance: ${message}`);
        }
    });

    next();
};
