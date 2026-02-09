export class CustomError extends Error {
    statusCode: number;
    multipleErrors: boolean;
    errors?: Array<{ field?: string; message: string; value?: unknown }>;

    constructor(message: string, statusCode: number, multipleErrors = false) {
        super(message);
        this.name = 'CustomError';
        this.statusCode = statusCode;
        this.multipleErrors = multipleErrors;
        
        // Maintient la stack trace pour le débogage
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
    }
}
