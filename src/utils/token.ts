/**
 * Génère un token aléatoire avec un préfixe
 * @returns Token aléatoire avec préfixe 'aw'
 */
export function generateRandomToken(): string {
    const prefix = 'aw';
    const randomString = Math.random().toString(36).substring(2, 20);
    return prefix + randomString;
}
