import { Tournament, AppSettings, Team, Match, TeamRankingRow, TargetRoundScore, DistanceAttempt, SpecialOlympicsRound } from "../types";

const SETTINGS_KEY = "stockapp_settings";
const LOCAL_DB_KEY = "stockapp_local_tournaments";

// Load settings from localStorage
export function loadSettings(): AppSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // use default
    }
  }
  return {
    serverUrl: window.location.origin,
    isOfflineMode: false,
    tvAutoScroll: true,
  };
}

// Save settings to localStorage
export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Fallback local tournaments database
function getLocalTournaments(): Tournament[] {
  const saved = localStorage.getItem(LOCAL_DB_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

function saveLocalTournaments(tournaments: Tournament[]) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(tournaments));
}

// Core API Wrapper
export const StockAPI = {
  // Get active base URL
  getBaseUrl(): string {
    const settings = loadSettings();
    if (settings.isOfflineMode) return "";
    return settings.serverUrl || window.location.origin;
  },

  // Check server connection
  async checkConnection(url?: string): Promise<boolean> {
    const activeUrl = url || this.getBaseUrl();
    try {
      const response = await fetch(`${activeUrl}/api/tournaments`, {
        signal: AbortSignal.timeout(3000), // 3s timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Fetch all tournaments
  async getTournaments(): Promise<Tournament[]> {
    const settings = loadSettings();
    if (settings.isOfflineMode) {
      return getLocalTournaments();
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/tournaments`);
      if (!response.ok) throw new Error("Server error");
      return await response.json();
    } catch (e) {
      console.warn("Server unavailable, falling back to local database:", e);
      return getLocalTournaments();
    }
  },

  // Fetch single tournament
  async getTournamentById(id: string): Promise<Tournament | null> {
    const settings = loadSettings();
    if (settings.isOfflineMode) {
      const list = getLocalTournaments();
      return list.find((t) => t.id === id) || null;
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/tournaments/${id}`);
      if (!response.ok) throw new Error("Tournament not found");
      return await response.json();
    } catch (e) {
      console.warn("Server unavailable, retrieving from local database:", e);
      const list = getLocalTournaments();
      return list.find((t) => t.id === id) || null;
    }
  },

  // Create tournament
  async createTournament(tournament: Partial<Tournament>): Promise<Tournament> {
    const settings = loadSettings();
    if (settings.isOfflineMode) {
      const list = getLocalTournaments();
      const newT: Tournament = {
        id: "t-local-" + Date.now(),
        name: tournament.name || "Neues Turnier",
        date: tournament.date || new Date().toISOString().split("T")[0],
        type: tournament.type || "team",
        location: tournament.location || "Stocksportplatz",
        status: tournament.status || "planned",
        teams: tournament.teams || [],
        matches: tournament.matches || [],
        targetParticipants: tournament.targetParticipants || [],
        kehrenCount: tournament.kehrenCount || (tournament.type === "target" ? 4 : 6),
      };
      list.push(newT);
      saveLocalTournaments(list);
      return newT;
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/tournaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tournament),
      });
      if (!response.ok) throw new Error("Could not create tournament on server");
      return await response.json();
    } catch (e) {
      console.warn("Server create failed, saving locally:", e);
      // fallback save local
      const list = getLocalTournaments();
      const newT: Tournament = {
        id: "t-local-" + Date.now(),
        name: tournament.name || "Neues Turnier",
        date: tournament.date || new Date().toISOString().split("T")[0],
        type: tournament.type || "team",
        location: tournament.location || "Stocksportplatz",
        status: tournament.status || "planned",
        teams: tournament.teams || [],
        matches: tournament.matches || [],
        targetParticipants: tournament.targetParticipants || [],
        kehrenCount: tournament.kehrenCount || (tournament.type === "target" ? 4 : 6),
      };
      list.push(newT);
      saveLocalTournaments(list);
      return newT;
    }
  },

  // Update tournament
  async updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament> {
    const settings = loadSettings();
    if (settings.isOfflineMode || id.startsWith("t-local-")) {
      const list = getLocalTournaments();
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, id };
        saveLocalTournaments(list);
        return list[idx];
      }
      throw new Error("Tournament not found");
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/tournaments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Could not update tournament on server");
      return await response.json();
    } catch (e) {
      console.warn("Server update failed, updating locally:", e);
      const list = getLocalTournaments();
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, id };
        saveLocalTournaments(list);
        return list[idx];
      }
      throw new Error("Local tournament also not found");
    }
  },

  // Cache sponsor image on server
  async cacheSponsorImage(id: string, imageUrl: string): Promise<{ success: boolean; cachedUrl: string; tournament: Tournament }> {
    const settings = loadSettings();
    if (settings.isOfflineMode || id.startsWith("t-local-")) {
      // In offline mode, keep the original image URL / base64 without saving it on server disk
      const list = getLocalTournaments();
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx].sponsorImage = imageUrl;
        saveLocalTournaments(list);
        return { success: true, cachedUrl: imageUrl, tournament: list[idx] };
      }
      throw new Error("Tournament not found");
    }

    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/tournaments/${id}/cache-sponsor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });
    if (!response.ok) {
      throw new Error("Sponsor image caching failed on server");
    }
    return await response.json();
  },

  // Enter match score
  async enterMatchScore(
    tournamentId: string,
    matchId: string,
    teamAScore: number,
    teamBScore: number,
    status: "active" | "completed" = "completed",
    isDQ?: boolean,
    dqTeamId?: string,
    isAbsent?: boolean,
    absentTeamId?: string
  ): Promise<Tournament> {
    const settings = loadSettings();
    if (settings.isOfflineMode || tournamentId.startsWith("t-local-")) {
      const list = getLocalTournaments();
      const idx = list.findIndex((t) => t.id === tournamentId);
      if (idx !== -1) {
        const match = list[idx].matches.find((m) => m.id === matchId);
        if (match) {
          match.teamAScore = teamAScore;
          match.teamBScore = teamBScore;
          match.status = status;
          match.isDQ = isDQ;
          match.dqTeamId = dqTeamId;
          match.isAbsent = isAbsent;
          match.absentTeamId = absentTeamId;
          match.timestamp = Date.now();
          saveLocalTournaments(list);
          return list[idx];
        }
      }
      throw new Error("Match not found locally");
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/tournaments/${tournamentId}/matches/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAScore, teamBScore, status, isDQ, dqTeamId, isAbsent, absentTeamId }),
      });
      if (!response.ok) throw new Error("Could not post match score to server");
      return await response.json();
    } catch (e) {
      console.warn("Server score post failed, saving locally:", e);
      const list = getLocalTournaments();
      const idx = list.findIndex((t) => t.id === tournamentId);
      if (idx !== -1) {
        const match = list[idx].matches.find((m) => m.id === matchId);
        if (match) {
          match.teamAScore = teamAScore;
          match.teamBScore = teamBScore;
          match.status = status;
          match.isDQ = isDQ;
          match.dqTeamId = dqTeamId;
          match.isAbsent = isAbsent;
          match.absentTeamId = absentTeamId;
          match.timestamp = Date.now();
          saveLocalTournaments(list);
          return list[idx];
        }
      }
      throw new Error("Local match score write failed");
    }
  },

  // Enter target score
  async enterTargetScore(
    tournamentId: string,
    participantId: string,
    scores: { round1?: number; round2?: number; round3?: number; round4?: number },
    rounds?: TargetRoundScore[],
    distanceAttempts?: DistanceAttempt[],
    specialOlympicsRounds?: SpecialOlympicsRound[],
    specialOlympicsLevel?: string,
    totalScore?: number
  ): Promise<Tournament> {
    const settings = loadSettings();
    if (settings.isOfflineMode || tournamentId.startsWith("t-local-")) {
      const list = getLocalTournaments();
      const idx = list.findIndex((t) => t.id === tournamentId);
      if (idx !== -1) {
        const participant = list[idx].targetParticipants.find((p) => p.id === participantId);
        if (participant) {
          participant.scores = { ...participant.scores, ...scores };
          if (rounds) participant.rounds = rounds;
          if (distanceAttempts) participant.distanceAttempts = distanceAttempts;
          if (specialOlympicsRounds) participant.specialOlympicsRounds = specialOlympicsRounds;
          if (specialOlympicsLevel) participant.specialOlympicsLevel = specialOlympicsLevel;
          
          if (totalScore !== undefined) {
            participant.totalScore = totalScore;
          } else {
            participant.totalScore =
              (participant.scores.round1 || 0) +
              (participant.scores.round2 || 0) +
              (participant.scores.round3 || 0) +
              (participant.scores.round4 || 0);
          }
          saveLocalTournaments(list);
          return list[idx];
        }
      }
      throw new Error("Participant not found locally");
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/tournaments/${tournamentId}/target/${participantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, rounds, distanceAttempts, specialOlympicsRounds, specialOlympicsLevel, totalScore }),
      });
      if (!response.ok) throw new Error("Could not post target score to server");
      return await response.json();
    } catch (e) {
      console.warn("Server target score post failed, saving locally:", e);
      const list = getLocalTournaments();
      const idx = list.findIndex((t) => t.id === tournamentId);
      if (idx !== -1) {
        const participant = list[idx].targetParticipants.find((p) => p.id === participantId);
        if (participant) {
          participant.scores = { ...participant.scores, ...scores };
          if (rounds) participant.rounds = rounds;
          if (distanceAttempts) participant.distanceAttempts = distanceAttempts;
          if (specialOlympicsRounds) participant.specialOlympicsRounds = specialOlympicsRounds;
          if (specialOlympicsLevel) participant.specialOlympicsLevel = specialOlympicsLevel;
          
          if (totalScore !== undefined) {
            participant.totalScore = totalScore;
          } else {
            participant.totalScore =
              (participant.scores.round1 || 0) +
              (participant.scores.round2 || 0) +
              (participant.scores.round3 || 0) +
              (participant.scores.round4 || 0);
          }
          saveLocalTournaments(list);
          return list[idx];
        }
      }
      throw new Error("Local target score write failed");
    }
  },

  // Delete tournament
  async deleteTournament(id: string): Promise<boolean> {
    const settings = loadSettings();
    if (settings.isOfflineMode || id.startsWith("t-local-")) {
      const list = getLocalTournaments();
      const filtered = list.filter((t) => t.id !== id);
      saveLocalTournaments(filtered);
      return true;
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/tournaments/${id}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (e) {
      console.warn("Server delete failed, deleting locally:", e);
      const list = getLocalTournaments();
      const filtered = list.filter((t) => t.id !== id);
      saveLocalTournaments(filtered);
      return true;
    }
  },
};

// Helper to compute team rankings using standard Stocksport rules
export function computeTeamRankings(
  teams: Team[],
  matches: Match[],
  rulesVersion: 'ier2022' | 'legacy3579' = 'legacy3579'
): TeamRankingRow[] {
  const rankingMap = new Map<string, Omit<TeamRankingRow, "rank">>();

  // Initialize
  teams.forEach((team) => {
    rankingMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      club: team.club || "",
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchPointsPositive: 0,
      matchPointsNegative: 0,
      stockPointsPositive: 0,
      stockPointsNegative: 0,
      stockPointsDiff: 0,
      stockNote: 0,
    });
  });

  // Calculate stats from matches
  matches.forEach((match) => {
    if (match.status !== "completed") return;

    const rowA = rankingMap.get(match.teamAId);
    const rowB = rankingMap.get(match.teamBId);

    if (rowA && rowB) {
      rowA.matchesPlayed += 1;
      rowB.matchesPlayed += 1;

      let scoreA = match.teamAScore;
      let scoreB = match.teamBScore;

      // Handle Disqualification (DQ) or Absent (Nichtantreten)
      if (match.isDQ || match.isAbsent) {
        const isDQ_A = (match.isDQ && match.dqTeamId === match.teamAId) || (match.isAbsent && match.absentTeamId === match.teamAId);
        const isDQ_B = (match.isDQ && match.dqTeamId === match.teamBId) || (match.isAbsent && match.absentTeamId === match.teamBId);

        if (isDQ_A && isDQ_B) {
          scoreA = 0;
          scoreB = 0;
        } else if (isDQ_A) {
          scoreA = 0;
          scoreB = 100;
        } else if (isDQ_B) {
          scoreA = 100;
          scoreB = 0;
        }
      }

      if (scoreA === null || scoreB === null) return;

      // Add Stock Points
      rowA.stockPointsPositive += scoreA;
      rowA.stockPointsNegative += scoreB;

      rowB.stockPointsPositive += scoreB;
      rowB.stockPointsNegative += scoreA;

      // Determine match points
      if (scoreA > scoreB) {
        rowA.wins += 1;
        rowA.matchPointsPositive += 2;
        rowA.matchPointsNegative += 0;

        rowB.losses += 1;
        rowB.matchPointsPositive += 0;
        rowB.matchPointsNegative += 2;
      } else if (scoreA < scoreB) {
        rowB.wins += 1;
        rowB.matchPointsPositive += 2;
        rowB.matchPointsNegative += 0;

        rowA.losses += 1;
        rowA.matchPointsPositive += 0;
        rowA.matchPointsNegative += 2;
      } else {
        // Draw
        rowA.draws += 1;
        rowA.matchPointsPositive += 1;
        rowA.matchPointsNegative += 1;

        rowB.draws += 1;
        rowB.matchPointsPositive += 1;
        rowB.matchPointsNegative += 1;
      }
    }
  });

  // Finalize calculations for each team
  const rankings: TeamRankingRow[] = Array.from(rankingMap.values()).map((row) => {
    const stockPointsDiff = row.stockPointsPositive - row.stockPointsNegative;

    // Stocknote = Eigene Stockpunkte / Gegnerische Stockpunkte
    // Handle division by zero nicely as per Stocksport standards (use opponent points as 1 if 0)
    const opponentPointsSafe = row.stockPointsNegative === 0 ? 1 : row.stockPointsNegative;
    const stockNote = Number((row.stockPointsPositive / opponentPointsSafe).toFixed(3));

    return {
      ...row,
      stockPointsDiff,
      stockNote,
      rank: 1, // temporary placeholder
    };
  });

  // Sort based on selected rulesVersion
  if (rulesVersion === 'ier2022') {
    // 1. Match Points descending
    // 2. Stocknote Quotient descending
    // 3. Stock Difference descending
    // 4. Positive Stock Points descending
    rankings.sort((a, b) => {
      if (b.matchPointsPositive !== a.matchPointsPositive) {
        return b.matchPointsPositive - a.matchPointsPositive;
      }
      if (b.stockNote !== a.stockNote) {
        return b.stockNote - a.stockNote;
      }
      if (b.stockPointsDiff !== a.stockPointsDiff) {
        return b.stockPointsDiff - a.stockPointsDiff;
      }
      return b.stockPointsPositive - a.stockPointsPositive;
    });
  } else {
    // legacy3579 (Points, Diff, Eigene, Note)
    // 1. Match Points descending
    // 2. Stock Difference descending
    // 3. Positive Stock Points descending
    // 4. Stocknote Quotient descending
    rankings.sort((a, b) => {
      if (b.matchPointsPositive !== a.matchPointsPositive) {
        return b.matchPointsPositive - a.matchPointsPositive;
      }
      if (b.stockPointsDiff !== a.stockPointsDiff) {
        return b.stockPointsDiff - a.stockPointsDiff;
      }
      if (b.stockPointsPositive !== a.stockPointsPositive) {
        return b.stockPointsPositive - a.stockPointsPositive;
      }
      return b.stockNote - a.stockNote;
    });
  }

  // Assign Ranks
  rankings.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rankings;
}

// Compute special tournament rankings for 3-lane mode (merging Group A & B and placement matches)
export function computeSpecialTournamentRankings(tournament: Tournament): (TeamRankingRow & { groupName?: string; finalRank?: number; groupRank?: number })[] {
  const teams = tournament.teams;
  const matches = tournament.matches;

  // 1. Get Group A and Group B teams
  const groupATeams = teams.filter(t => t.group === "Gruppe A" || !t.group); // Default to Group A if not set
  const groupBTeams = teams.filter(t => t.group === "Gruppe B");

  // 2. Get Vorrunde matches
  const vorrundeMatches = matches.filter(m => m.phase === "vorrunde" || !m.phase);

  // 3. Compute group rankings
  const rankingsA = computeTeamRankings(groupATeams, vorrundeMatches, tournament.rulesVersion);
  const rankingsB = computeTeamRankings(groupBTeams, vorrundeMatches, tournament.rulesVersion);

  // 4. Get placement matches
  const placementMatches = matches.filter(m => m.phase === "platzierung");

  // If there are no placement matches generated yet, we just return the group rankings combined or side-by-side
  if (placementMatches.length === 0) {
    const combined: any[] = [];
    rankingsA.forEach(r => combined.push({ ...r, groupName: "Gruppe A", groupRank: r.rank, finalRank: undefined }));
    rankingsB.forEach(r => combined.push({ ...r, groupName: "Gruppe B", groupRank: r.rank, finalRank: undefined }));
    return combined;
  }

  // Map of teamId -> final rank
  const finalRanks = new Map<string, number>();
  const finalStats = new Map<string, any>();

  // Initialize stats with combined stats from both Vorrunde and Placement
  teams.forEach(t => {
    const isB = t.group === "Gruppe B";
    const grRank = isB ? rankingsB.find(r => r.teamId === t.id) : rankingsA.find(r => r.teamId === t.id);
    
    finalStats.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      club: t.club || "",
      groupName: isB ? "Gruppe B" : "Gruppe A",
      groupRank: grRank ? grRank.rank : 99,
      matchesPlayed: grRank ? grRank.matchesPlayed : 0,
      wins: grRank ? grRank.wins : 0,
      draws: grRank ? grRank.draws : 0,
      losses: grRank ? grRank.losses : 0,
      matchPointsPositive: grRank ? grRank.matchPointsPositive : 0,
      matchPointsNegative: grRank ? grRank.matchPointsNegative : 0,
      stockPointsPositive: grRank ? grRank.stockPointsPositive : 0,
      stockPointsNegative: grRank ? grRank.stockPointsNegative : 0,
      stockPointsDiff: grRank ? grRank.stockPointsDiff : 0,
      stockNote: grRank ? grRank.stockNote : 0,
    });
  });

  // Process placement matches to determine final ranks
  const maxRanks = Math.max(rankingsA.length, rankingsB.length);

  for (let grRank = 1; grRank <= maxRanks; grRank++) {
    const teamAAtRank = rankingsA.find(r => r.rank === grRank);
    const teamBAtRank = rankingsB.find(r => r.rank === grRank);

    if (teamAAtRank && teamBAtRank) {
      // Find the placement match involving these two teams
      const match = placementMatches.find(m => 
        (m.teamAId === teamAAtRank.teamId && m.teamBId === teamBAtRank.teamId) ||
        (m.teamAId === teamBAtRank.teamId && m.teamBId === teamAAtRank.teamId)
      );

      if (match && match.status === "completed" && match.teamAScore !== null && match.teamBScore !== null) {
        // Add stats from placement match
        const statsA = finalStats.get(match.teamAId);
        const statsB = finalStats.get(match.teamBId);
        if (statsA && statsB) {
          statsA.matchesPlayed += 1;
          statsB.matchesPlayed += 1;
          statsA.stockPointsPositive += match.teamAScore;
          statsA.stockPointsNegative += match.teamBScore;
          statsB.stockPointsPositive += match.teamBScore;
          statsB.stockPointsNegative += match.teamAScore;
          
          if (match.teamAScore > match.teamBScore) {
            statsA.wins += 1;
            statsA.matchPointsPositive += 2;
            statsB.losses += 1;
            statsB.matchPointsNegative += 2;
            
            finalRanks.set(match.teamAId, grRank * 2 - 1); // e.g. Rank 1 gets 1st
            finalRanks.set(match.teamBId, grRank * 2);     // e.g. Rank 1 gets 2nd
          } else if (match.teamBScore > match.teamAScore) {
            statsB.wins += 1;
            statsB.matchPointsPositive += 2;
            statsA.losses += 1;
            statsA.matchPointsNegative += 2;
            
            finalRanks.set(match.teamBId, grRank * 2 - 1);
            finalRanks.set(match.teamAId, grRank * 2);
          } else {
            // Draw in placement
            statsA.draws += 1;
            statsA.matchPointsPositive += 1;
            statsA.matchPointsNegative += 1;
            statsB.draws += 1;
            statsB.matchPointsPositive += 1;
            statsB.matchPointsNegative += 1;
            
            finalRanks.set(match.teamAId, grRank * 2 - 1);
            finalRanks.set(match.teamBId, grRank * 2);
          }
        }
      } else {
        // Placement match not completed or not found, provisional ranks
        finalRanks.set(teamAAtRank.teamId, grRank * 2 - 1);
        finalRanks.set(teamBAtRank.teamId, grRank * 2);
      }
    } else if (teamAAtRank) {
      finalRanks.set(teamAAtRank.teamId, grRank * 2 - 1);
    } else if (teamBAtRank) {
      finalRanks.set(teamBAtRank.teamId, grRank * 2 - 1);
    }
  }

  // Build the list of overall standings
  const combinedList = Array.from(finalStats.values()).map(stats => {
    const oppSafe = stats.stockPointsNegative === 0 ? 1 : stats.stockPointsNegative;
    const stockNote = Number((stats.stockPointsPositive / oppSafe).toFixed(3));
    const stockPointsDiff = stats.stockPointsPositive - stats.stockPointsNegative;
    
    return {
      ...stats,
      stockNote,
      stockPointsDiff,
      finalRank: finalRanks.get(stats.teamId) || 99,
      rank: finalRanks.get(stats.teamId) || 99,
    };
  });

  // Sort by final rank
  combinedList.sort((a, b) => a.finalRank - b.finalRank);

  // Assign clean rank sequence
  combinedList.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  return combinedList;
}
