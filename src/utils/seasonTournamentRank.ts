export type SeasonTournamentTier =
    | 'novice'
    | 'bronze'
    | 'argent'
    | 'or'
    | 'platine'
    | 'diamant'
    | 'master';

export const SEASON_TOURNAMENT_TIERS: Array<{
    id: SeasonTournamentTier;
    minPoints: number;
}> = [
    { id: 'novice', minPoints: 0 },
    { id: 'bronze', minPoints: 5 },
    { id: 'argent', minPoints: 10 },
    { id: 'or', minPoints: 20 },
    { id: 'platine', minPoints: 35 },
    { id: 'diamant', minPoints: 50 },
    { id: 'master', minPoints: 100 },
];

export type SeasonTournamentTierInfo = {
    tier: SeasonTournamentTier;
    minPoints: number;
    nextTier: SeasonTournamentTier | null;
    nextTierMinPoints: number | null;
    pointsToNextTier: number | null;
};

export function resolveSeasonTournamentTier(
    points: number
): SeasonTournamentTierInfo {
    const pts = Math.max(0, Math.floor(Number(points) || 0));
    let current = SEASON_TOURNAMENT_TIERS[0];
    for (const tier of SEASON_TOURNAMENT_TIERS) {
        if (pts >= tier.minPoints) current = tier;
    }
    const index = SEASON_TOURNAMENT_TIERS.findIndex((t) => t.id === current.id);
    const next = SEASON_TOURNAMENT_TIERS[index + 1] ?? null;
    return {
        tier: current.id,
        minPoints: current.minPoints,
        nextTier: next?.id ?? null,
        nextTierMinPoints: next?.minPoints ?? null,
        pointsToNextTier:
            next != null ? Math.max(0, next.minPoints - pts) : null,
    };
}
