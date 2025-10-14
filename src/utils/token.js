export function generateRandomToken() {
    const prefix = 'aw';
    const randomString = Math.random().toString(36).substr(2, 18);
    return prefix + randomString;
}