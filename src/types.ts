export type TournamentType = 'team' | 'target';

export interface Team {
  id: string;
  name: string;
  club?: string;
  players?: string[]; // e.g., Player 1, Player 2, Player 3, Player 4
  group?: string; // e.g., "Gruppe A", "Gruppe B"
}

export interface Match {
  id: string;
  round: number;
  court: string; // e.g., "Bahn 1", "Bahn 2", "Bahn 3"
  teamAId: string;
  teamBId: string;
  teamAScore: number | null; // Own stock points
  teamBScore: number | null; // Opponent stock points
  status: 'planned' | 'active' | 'completed';
  timestamp?: number;
  phase?: 'vorrunde' | 'platzierung'; // Phase of the tournament
  kehrenCount?: number; // Custom kehren count for this match (e.g. 4 for Vorrunde, 6 for Placement)
  durchgang?: number; // Concurrent block / timeslot for 3-lane scheduling
}

export interface TargetScore {
  round1: number; // Max 50
  round2: number; // Max 50
  round3: number; // Max 50
  round4: number; // Max 50
}

export interface TargetParticipant {
  id: string;
  playerName: string;
  clubName: string;
  scores: TargetScore;
  totalScore: number;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  type: TournamentType;
  location: string;
  status: 'planned' | 'active' | 'completed';
  teams: Team[]; // Only for Team tournament
  matches: Match[]; // Only for Team tournament
  targetParticipants: TargetParticipant[]; // Only for Target tournament
  kehrenCount: number; // default 6
  maxCourts?: number; // default 3
  isSpecialThreeLaneMode?: boolean; // specialized 3-lane mode (Vorrunde 4 Kehren, Platzierung 6 Kehren)
}

export interface AppSettings {
  serverUrl: string; // Dynamic URL for server backend
  isOfflineMode: boolean; // Local-only mode
  tvAutoScroll: boolean; // Auto scroll the TV display
}

// Stats computed for leaderboards
export interface TeamRankingRow {
  teamId: string;
  teamName: string;
  club?: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  matchPointsPositive: number; // Spielpunkte plus (e.g. 2 for win)
  matchPointsNegative: number; // Spielpunkte minus (e.g. 2 for loss)
  stockPointsPositive: number; // Eigene Stockpunkte
  stockPointsNegative: number; // Gegnerische Stockpunkte
  stockPointsDiff: number; // Stockpunkte-Differenz
  stockNote: number; // Quotient (Positive / Negative)
  rank: number;
}
