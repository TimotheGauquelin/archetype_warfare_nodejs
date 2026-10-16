export type MatchResolutionMode = 'strict_wins' | 'highest_score';

export type MatchOutcome = 'p1_win' | 'p2_win' | 'draw' | 'double_loss';

/** Nombre de manches gagnantes pour un Best of N (Bo3 → 2, Bo5 → 3, Bo1 → 1). */
export function getWinsNeeded(matchesPerRound: number): number {
    return Math.max(1, Math.ceil((Number(matchesPerRound) || 1) / 2));
}

/**
 * Score max autorisé pour l'adversaire quand un joueur a déjà `ownGamesWon`.
 * Ex. Bo3 : si l'un a 2, l'autre max 1.
 */
export function getMaxOpponentGamesWon(ownGamesWon: number, winsNeeded: number): number {
    const own = Math.max(0, Number(ownGamesWon) || 0);
    if (own >= winsNeeded) {
        return Math.max(0, winsNeeded - 1);
    }
    return winsNeeded;
}

/**
 * Résout le résultat d'un match selon le mode du tournoi.
 * - strict_wins : il faut atteindre winsNeeded, sinon double défaite (pas d'égalité).
 * - highest_score : le plus haut score gagne ; égalité si scores > 0 égaux ; 0-0 = double défaite.
 */
export function resolveMatchOutcome(
    player1GamesWon: number,
    player2GamesWon: number,
    winsNeeded: number,
    mode: MatchResolutionMode = 'strict_wins'
): MatchOutcome {
    const p1 = Math.max(0, Number(player1GamesWon) || 0);
    const p2 = Math.max(0, Number(player2GamesWon) || 0);

    if (mode === 'highest_score') {
        if (p1 > p2) return 'p1_win';
        if (p2 > p1) return 'p2_win';
        if (p1 === 0 && p2 === 0) return 'double_loss';
        return 'draw';
    }

    // strict_wins
    if (p1 === winsNeeded && p2 < winsNeeded) return 'p1_win';
    if (p2 === winsNeeded && p1 < winsNeeded) return 'p2_win';
    return 'double_loss';
}
