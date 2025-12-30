
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        logger.error(`Error ${err.statusCode}: ${err.message}`, { stack: err.stack });

        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    } else {
        // Production
        if (err.isOperational) {
            // Trusted operational error: send message to client
            logger.warn(`Operational Error: ${err.message}`);

            res.status(err.statusCode).json({
                success: false,
                status: err.status,
                message: err.message
            });
        } else {
            // Programming or other unknown error: don't leak details
            logger.error('ERROR 💥', err);

            res.status(500).json({
                success: false,
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
};
