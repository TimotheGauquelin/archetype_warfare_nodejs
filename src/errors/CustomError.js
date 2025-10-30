export class CustomError extends Error {
    constructor(message, statusCode, multipleErrors = false) {
        super(message);
        this.statusCode = statusCode;
        this.multipleErrors = multipleErrors || false;
    }
}