import { ICustomError } from '../interfaces/errors.js';

class CustomError extends Error implements ICustomError {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default CustomError; 