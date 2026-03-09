/**
 * Utility function to safely extract a string parameter from request.params
 * @param param - The parameter value from request.params
 * @returns The parameter as a string, or throws an error if it's an array
 */
export const getStringParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) {
        return param[0] || '';
    }
    return param || '';
};

/**
 * Utility function to safely extract and parse an integer parameter from request.params
 * @param param - The parameter value from request.params
 * @returns The parsed integer, or throws an error if invalid
 */
export const getIntParam = (param: string | string[] | undefined): number => {
    const str = getStringParam(param);
    const parsed = parseInt(str, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid integer parameter: ${param}`);
    }
    return parsed;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Utility function to safely extract and validate a UUID parameter from request.params
 * @param param - The parameter value from request.params
 * @returns The parameter as a string (UUID), or throws an error if invalid
 */
export const getUuidParam = (param: string | string[] | undefined): string => {
    const str = getStringParam(param);
    if (!str || !UUID_REGEX.test(str)) {
        throw new Error(`Invalid UUID parameter: ${param}`);
    }
    return str;
};
