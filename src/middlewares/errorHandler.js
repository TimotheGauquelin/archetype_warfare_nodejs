export const ErrorHandler = (err, req, res, next) => {
    const errStatus = err.statusCode || 500;
    const errMessage = err.message || 'Une erreur inconnue s\'est produite';
    const haveMultipleErrors = err.multipleErrors || false;
    if (haveMultipleErrors) {
        res.status(errStatus).json({
            message: errMessage,
            status: errStatus,
            multipleErrors: true
        });
    } else {
        res.status(errStatus).json({
            message: errMessage,
            status: errStatus,
        });
    }
};