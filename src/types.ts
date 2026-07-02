export type TournamentType = 'team' | 'target' | 'distance' | 'special-olympics';

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
  isDQ?: boolean; // Disqualification flag
  dqTeamId?: string; // Id of the team that got disqualified
  isAbsent?: boolean; // Non-attendance flag
  absentTeamId?: string; // Id of the team that did not attend
}

export interface TargetScore {
  round1: number; // Max 50
  round2: number; // Max 50
  round3: number; // Max 50
  round4: number; // Max 50
}

export interface TargetRoundScore {
  roundIndex: number; // 1-based, up to 16
  pass1: number; // Max 50
  pass2: number; // Max 50
  pass3: number; // Max 50
  pass4: number; // Max 50
  total: number;
}

export interface DistanceAttempt {
  roundIndex: number; // 1-based
  attempt1: number | null; // Distance in meters (null = invalid/ungültig)
  attempt2: number | null;
  attempt3: number | null;
  attempt4: number | null;
  attempt5: number | null;
  best: number; // Best attempt in this round
  total: number; // Sum of valid attempts
}

export interface SpecialOlympicsAttempt {
  attemptIndex: number; // 1 to 8
  score: number; // score of this attempt
}

export interface SpecialOlympicsRound {
  roundIndex: number; // 1-based, up to 16
  attempts: SpecialOlympicsAttempt[]; // 8 attempts
  total: number;
}

export interface TargetParticipant {
  id: string;
  playerName: string;
  clubName: string;
  scores: TargetScore; // backward compatibility
  totalScore: number;
  rounds?: TargetRoundScore[]; // Up to 16 rounds of Zielwettbewerb
  distanceAttempts?: DistanceAttempt[]; // Up to 16 rounds of Weitenwettbewerb
  specialOlympicsLevel?: string; // e.g., "Level 1"
  specialOlympicsRounds?: SpecialOlympicsRound[]; // Up to 16 rounds of Special Olympics
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
  targetParticipants: TargetParticipant[]; // Only for Target/Distance/Special Olympics tournaments
  kehrenCount: number; // default 6
  maxCourts?: number; // default 3
  isSpecialThreeLaneMode?: boolean; // specialized 3-lane mode
  rulesVersion?: 'ier2022' | 'legacy3579'; // IER 2022 vs Legacy rules
  competitionLeader?: string; // Wettbewerbsleiter
  referee?: string; // Schiedsrichter
  clerk?: string; // Schriftführer
  association?: string; // Landesverband / Durchführer
  sponsorImage?: string; // Base64 or URL
  headerImage?: string; // Base64 or URL
  logoImage?: string; // Base64 or URL
  archived?: boolean;
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
