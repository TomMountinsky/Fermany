class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        //This is a programming error, so we don't want to leak this error to the client
        this.isOperational = true;

        //This is a stack trace of where the error happened
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;