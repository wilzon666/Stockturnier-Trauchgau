import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Users,
  Target,
  Edit2,
  ArrowRight,
  Shuffle,
  Eye,
  CheckCircle,
  AlertCircle,
  Settings,
  Swords,
  Shield,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { Tournament, Team, TargetParticipant, Match, TournamentType, ClubDuelConfig } from "../types";
import { computeTeamRankings, computeClubDuelStats, StockAPI } from "../lib/api";

interface TournamentsTabProps {
  tournaments: Tournament[];
  onCreateTournament: (t: Partial<Tournament>) => void;
  onUpdateTournament: (id: string, updates: Partial<Tournament>) => void;
  onDeleteTournament: (id: string) => void;
  onSelectTournament: (id: string) => void;
  activeTournament: Tournament | null;
}

export default function TournamentsTab({
  tournaments,
  onCreateTournament,
  onUpdateTournament,
  onDeleteTournament,
  onSelectTournament,
  activeTournament,
}: TournamentsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [listTab, setListTab] = useState<"active" | "archived">("active");
  const [confirmAction, setConfirmAction] = useState<{
    type: "archive" | "delete";
    tournamentId: string;
    tournamentName: string;
  } | null>(null);
  
  const filteredTournaments = tournaments.filter((t) => {
    if (listTab === "active") {
      return !t.archived;
    } else {
      return !!t.archived;
    }
  });

  const isLocked = activeTournament ? (activeTournament.status !== "planned" || !!activeTournament.archived) : false;
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<TournamentType>("team");
  const [location, setLocation] = useState("");
  const [kehrenCount, setKehrenCount] = useState(6);
  const [maxCourts, setMaxCourts] = useState(3);
  const [isSpecialThreeLaneMode, setIsSpecialThreeLaneMode] = useState(false);
  const [rulesVersion, setRulesVersion] = useState<'ier2022' | 'legacy3579'>('legacy3579');
  const [association, setAssociation] = useState("");
  const [competitionLeader, setCompetitionLeader] = useState("");
  const [referee, setReferee] = useState("");
  const [clerk, setClerk] = useState("");

  // Duel (Vereinsvergleich) specific state
  const [duelClubA, setDuelClubA] = useState("");
  const [duelClubB, setDuelClubB] = useState("");
  const [duelTeamsCountA, setDuelTeamsCountA] = useState(3);
  const [duelTeamsCountB, setDuelTeamsCountB] = useState(3);
  const [duelRoundsCount, setDuelRoundsCount] = useState(2);
  const [addTeamForClub, setAddTeamForClub] = useState<"A" | "B">("A");

  // Inline team editing
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const [editingDuelClubs, setEditingDuelClubs] = useState(false);
  const [editClubAName, setEditClubAName] = useState("");
  const [editClubBName, setEditClubBName] = useState("");

  // Caching sponsor logo state
  const [cachingSponsor, setCachingSponsor] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [cacheSuccess, setCacheSuccess] = useState(false);

  const handleCacheSponsorImage = async () => {
    if (!activeTournament || !activeTournament.sponsorImage) return;
    setCachingSponsor(true);
    setCacheError(null);
    setCacheSuccess(false);
    try {
      const res = await StockAPI.cacheSponsorImage(activeTournament.id, activeTournament.sponsorImage);
      if (res.success) {
        setCacheSuccess(true);
        onUpdateTournament(activeTournament.id, { sponsorImage: res.cachedUrl });
        setTimeout(() => setCacheSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error("Failed to cache sponsor image", err);
      setCacheError(err.message || "Fehler beim Herunterladen des Bildes.");
    } finally {
      setCachingSponsor(false);
    }
  };

  // For editing details
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamClub, setNewTeamClub] = useState("");
  const [newTeamPlayers, setNewTeamPlayers] = useState("");

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerClub, setNewPlayerClub] = useState("");
  const [newSpecialOlympicsLevel, setNewSpecialOlympicsLevel] = useState("Level I");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clubA = duelClubA.trim() || "Mannschaft 1";
    const clubB = duelClubB.trim() || "Mannschaft 2";
    const finalName = name.trim() || (type === "duell" ? `Vereinsvergleich: ${clubA} vs. ${clubB}` : "Neues Turnier");
    if (!finalName) return;

    let initialTeams: Team[] = [];
    if (type === "duell") {
      for (let i = 1; i <= duelTeamsCountA; i++) {
        initialTeams.push({
          id: `team-a-${Date.now()}-${i}`,
          name: duelClubA.trim() ? `${clubA} ${i}` : `Mannschaft 1 - Team ${i}`,
          club: clubA,
          group: "A",
        });
      }
      for (let i = 1; i <= duelTeamsCountB; i++) {
        initialTeams.push({
          id: `team-b-${Date.now()}-${i}`,
          name: duelClubB.trim() ? `${clubB} ${i}` : `Mannschaft 2 - Team ${i}`,
          club: clubB,
          group: "B",
        });
      }
    }

    onCreateTournament({
      name: finalName,
      date,
      type,
      location: location || "Stocksportplatz",
      status: "planned",
      kehrenCount: isSpecialThreeLaneMode ? 4 : kehrenCount,
      maxCourts,
      isSpecialThreeLaneMode,
      rulesVersion,
      association: association.trim() || undefined,
      competitionLeader: competitionLeader.trim() || undefined,
      referee: referee.trim() || undefined,
      clerk: clerk.trim() || undefined,
      teams: initialTeams,
      matches: [],
      targetParticipants: [],
      clubDuelConfig: type === "duell" ? {
        clubAName: clubA,
        clubBName: clubB,
        teamsCountA: duelTeamsCountA,
        teamsCountB: duelTeamsCountB,
        roundsCount: duelRoundsCount,
      } : undefined,
    });

    // Reset
    setName("");
    setLocation("");
    setMaxCourts(3);
    setIsSpecialThreeLaneMode(false);
    setKehrenCount(6);
    setRulesVersion("legacy3579");
    setAssociation("");
    setCompetitionLeader("");
    setReferee("");
    setClerk("");
    setDuelClubA("");
    setDuelClubB("");
    setDuelTeamsCountA(3);
    setDuelTeamsCountB(3);
    setDuelRoundsCount(2);
    setEditingTeamId(null);
    setShowCreateModal(false);
  };

  // Round robin scheduler generator with lane constraint & group splitting & 2-club duel
  const handleGenerateSchedule = () => {
    if (!activeTournament || (activeTournament.type !== "team" && activeTournament.type !== "duell")) return;
    if (activeTournament.status !== "planned") {
      alert("Der Spielplan kann nicht generiert werden, da das Turnier bereits aktiv oder beendet ist.");
      return;
    }
    const teams = activeTournament.teams;
    if (teams.length < 2) {
      alert("Es müssen mindestens 2 Teams vorhanden sein, um einen Spielplan zu generieren.");
      return;
    }

    const maxLanes = activeTournament.maxCourts || 3;

    // 2-Club Duel Cross-Scheduler (Vereinsvergleich: z.B. Trauchgau vs. Prem)
    if (activeTournament.type === "duell") {
      const clubAName = activeTournament.clubDuelConfig?.clubAName || "Mannschaft 1";
      const clubBName = activeTournament.clubDuelConfig?.clubBName || "Mannschaft 2";

      const teamsA = teams.filter(t => 
        t.group === "A" || 
        t.id.startsWith("team-a-") || 
        t.club === clubAName || 
        t.group === clubAName || 
        (clubAName && t.name.toLowerCase().includes(clubAName.toLowerCase()))
      );
      const teamsB = teams.filter(t => !teamsA.some(ta => ta.id === t.id));

      // Sort teams deterministically by ID
      teamsA.sort((a, b) => a.id.localeCompare(b.id));
      teamsB.sort((a, b) => a.id.localeCompare(b.id));

      if (teamsA.length === 0 || teamsB.length === 0) {
        alert(`Für den Vereinsvergleich müssen Teams für beide Mannschaften (${clubAName} und ${clubBName}) vorhanden sein.`);
        return;
      }

      const roundsCount = activeTournament.clubDuelConfig?.roundsCount || 2;
      const nA = teamsA.length;
      const nB = teamsB.length;
      const K = Math.max(nA, nB);
      const matches: Match[] = [];
      let matchCounter = 1;
      let globalDurchgang = 1;
      let globalRound = 1;

      for (let d = 1; d <= roundsCount; d++) {
        const isOddDurchgang = d % 2 === 1;

        for (let r = 0; r < K; r++) {
          const roundPairings: { teamAId: string; teamBId: string; laneIndex: number }[] = [];

          if (isOddDurchgang) {
            // Durchgang 1, 3, ...: Teams von Mannschaft 1 BLEIBEN auf ihren jeweiligen Bahnen!
            // Team A_i bleibt auf Bahn (i + 1), gegnerische Teams von B rotieren durch
            for (let i = 0; i < nA; i++) {
              const j = (i + r) % K;
              if (j < nB) {
                roundPairings.push({
                  teamAId: teamsA[i].id,
                  teamBId: teamsB[j].id,
                  laneIndex: (i % maxLanes) + 1,
                });
              }
            }
          } else {
            // Durchgang 2, 4, ...: Teams von Mannschaft 2 BLEIBEN auf ihren jeweiligen Bahnen!
            // Team B_j bleibt auf Bahn (j + 1) und hat Heimrecht (Fairness)
            for (let j = 0; j < nB; j++) {
              const i = (j + r) % K;
              if (i < nA) {
                roundPairings.push({
                  teamAId: teamsB[j].id,
                  teamBId: teamsA[i].id,
                  laneIndex: (j % maxLanes) + 1,
                });
              }
            }
          }

          // Verteile Begegnungen auf Bahnen und Timeslots
          const numTimeslotsNeeded = Math.ceil(roundPairings.length / maxLanes);
          for (let slot = 0; slot < numTimeslotsNeeded; slot++) {
            const slotPairings = roundPairings.slice(slot * maxLanes, (slot + 1) * maxLanes);
            slotPairings.forEach((pair) => {
              matches.push({
                id: `m-duel-d${d}-r${r + 1}-${matchCounter++}`,
                round: globalRound,
                court: `Bahn ${pair.laneIndex}`,
                teamAId: pair.teamAId,
                teamBId: pair.teamBId,
                teamAScore: null,
                teamBScore: null,
                status: "planned",
                kehrenCount: activeTournament.kehrenCount || 6,
                durchgang: globalDurchgang,
              });
            });
            globalDurchgang++;
          }
          globalRound++;
        }
      }

      onUpdateTournament(activeTournament.id, { matches });
      return;
    }

    if (activeTournament.isSpecialThreeLaneMode) {
      // 3-lane Special Mode: split into Group A & B
      let finalTeams = [...teams];
      const hasUnassigned = finalTeams.some((t) => !t.group);
      if (hasUnassigned) {
        finalTeams = finalTeams.map((t, idx) => ({
          ...t,
          group: t.group || (idx % 2 === 0 ? "Gruppe A" : "Gruppe B"),
        }));
        // Update database with assigned groups
        onUpdateTournament(activeTournament.id, { teams: finalTeams });
      }

      const groupATeams = finalTeams.filter((t) => t.group === "Gruppe A" || !t.group);
      const groupBTeams = finalTeams.filter((t) => t.group === "Gruppe B");

      if (groupATeams.length === 0 || groupBTeams.length === 0) {
        alert("Für das Spezialturnier müssen Teams in Gruppe A und Gruppe B vorhanden sein.");
        return;
      }

      // Local helper to generate round robin matches for a group
      const generateRoundRobinForGroup = (groupTeams: Team[], groupName: string) => {
        const list = [...groupTeams];
        const isOdd = list.length % 2 !== 0;
        if (isOdd) {
          list.push({ id: `bye-${groupName}`, name: "SPIELFREI", group: groupName });
        }

        const numTeams = list.length;
        const numRounds = numTeams - 1;
        const matchesPerRound = numTeams / 2;
        const roundsList: { teamAId: string; teamBId: string }[][] = [];

        for (let r = 0; r < numRounds; r++) {
          const roundMatches: { teamAId: string; teamBId: string }[] = [];
          for (let mIdx = 0; mIdx < matchesPerRound; mIdx++) {
            const home = list[mIdx];
            const away = list[numTeams - 1 - mIdx];

            if (home.id !== `bye-${groupName}` && away.id !== `bye-${groupName}`) {
              roundMatches.push({ teamAId: home.id, teamBId: away.id });
            }
          }
          roundsList.push(roundMatches);

          // Rotate using circle method
          const last = list.pop()!;
          list.splice(1, 0, last);
        }
        return roundsList;
      };

      const roundsA = generateRoundRobinForGroup(groupATeams, "Gruppe A");
      const roundsB = generateRoundRobinForGroup(groupBTeams, "Gruppe B");
      const maxRounds = Math.max(roundsA.length, roundsB.length);

      const matches: Match[] = [];
      let matchCounter = 1;
      let globalDurchgang = 1;

      for (let r = 0; r < maxRounds; r++) {
        const roundPairings: { teamAId: string; teamBId: string }[] = [];
        if (roundsA[r]) roundPairings.push(...roundsA[r]);
        if (roundsB[r]) roundPairings.push(...roundsB[r]);

        // Schedule pairings across maxLanes (default 3)
        const numTimeslotsNeeded = Math.ceil(roundPairings.length / maxLanes);

        for (let slot = 0; slot < numTimeslotsNeeded; slot++) {
          const slotPairings = roundPairings.slice(slot * maxLanes, (slot + 1) * maxLanes);
          slotPairings.forEach((pair, idx) => {
            matches.push({
              id: `m-vorrunde-${r + 1}-${matchCounter++}`,
              round: r + 1,
              court: `Bahn ${idx + 1}`,
              teamAId: pair.teamAId,
              teamBId: pair.teamBId,
              teamAScore: null,
              teamBScore: null,
              status: "planned",
              phase: "vorrunde",
              kehrenCount: 4, // 4 Kehren pro Spiel in der Vorrunde
              durchgang: globalDurchgang,
            });
          });
          globalDurchgang++;
        }
      }

      onUpdateTournament(activeTournament.id, { matches });
    } else {
      // Standard Round Robin mode, but respecting court limits
      const matches: Match[] = [];
      const list = [...teams];

      const isOdd = list.length % 2 !== 0;
      if (isOdd) {
        list.push({ id: "bye", name: "SPIELFREI" });
      }

      const numTeams = list.length;
      const numRounds = numTeams - 1;
      const matchesPerRound = numTeams / 2;

      let matchCounter = 1;
      let globalDurchgang = 1;

      for (let round = 0; round < numRounds; round++) {
        const roundPairings: { teamAId: string; teamBId: string }[] = [];
        for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
          const home = list[matchIdx];
          const away = list[numTeams - 1 - matchIdx];

          if (home.id !== "bye" && away.id !== "bye") {
            roundPairings.push({ teamAId: home.id, teamBId: away.id });
          }
        }

        // Schedule pairings across maxLanes
        const numTimeslotsNeeded = Math.ceil(roundPairings.length / maxLanes);

        for (let slot = 0; slot < numTimeslotsNeeded; slot++) {
          const slotPairings = roundPairings.slice(slot * maxLanes, (slot + 1) * maxLanes);
          slotPairings.forEach((pair, idx) => {
            matches.push({
              id: `m-gen-${round + 1}-${matchCounter++}`,
              round: round + 1,
              court: `Bahn ${idx + 1}`,
              teamAId: pair.teamAId,
              teamBId: pair.teamBId,
              teamAScore: null,
              teamBScore: null,
              status: "planned",
              kehrenCount: activeTournament.kehrenCount || 6,
              durchgang: globalDurchgang,
            });
          });
          globalDurchgang++;
        }

        // Rotate list using circle method
        const last = list.pop()!;
        list.splice(1, 0, last);
      }

      onUpdateTournament(activeTournament.id, { matches });
    }
  };

  // Generate Placement Matches (Platzierungsspiele) based on group standings
  const handleGeneratePlacementMatches = () => {
    if (!activeTournament || activeTournament.type !== "team" || !activeTournament.isSpecialThreeLaneMode) return;
    if (activeTournament.status === "completed") {
      alert("Platzierungsspiele können in einem beendeten Turnier nicht mehr generiert werden.");
      return;
    }

    const vorrundeMatches = activeTournament.matches.filter((m) => m.phase === "vorrunde" || !m.phase);
    const incomplete = vorrundeMatches.filter((m) => m.status !== "completed");
    if (incomplete.length > 0) {
      if (!confirm(`Achtung: Es sind noch ${incomplete.length} Vorrunden-Spiele offen. Möchten Sie die Platzierungsspiele trotzdem generieren?`)) {
        return;
      }
    }

    const groupATeams = activeTournament.teams.filter((t) => t.group === "Gruppe A" || !t.group);
    const groupBTeams = activeTournament.teams.filter((t) => t.group === "Gruppe B");

    // Compute standalone standings for groups
    const rankingsA = computeTeamRankings(groupATeams, vorrundeMatches);
    const rankingsB = computeTeamRankings(groupBTeams, vorrundeMatches);

    const maxVorrundeDurchgang = vorrundeMatches.reduce((max, m) => Math.max(max, m.durchgang || 0), 0);
    let nextDurchgang = maxVorrundeDurchgang + 1;

    const maxRanks = Math.max(rankingsA.length, rankingsB.length);
    const placementMatches: Match[] = [];
    const maxLanes = activeTournament.maxCourts || 3;

    // Build pairings
    const placementPairings: { teamAId: string; teamBId: string; rank: number }[] = [];
    for (let grRank = 1; grRank <= maxRanks; grRank++) {
      const teamA = rankingsA.find((r) => r.rank === grRank);
      const teamB = rankingsB.find((r) => r.rank === grRank);
      if (teamA && teamB) {
        placementPairings.push({ teamAId: teamA.teamId, teamBId: teamB.teamId, rank: grRank });
      }
    }

    // Sort descending by rank so the lower placement games (Rank 9 vs 9) are in the first slots
    // and the grand finale (Rank 1 vs 1) is in the last slot!
    placementPairings.sort((a, b) => b.rank - a.rank);

    const numTimeslotsNeeded = Math.ceil(placementPairings.length / maxLanes);
    let matchCounter = 1;

    for (let slot = 0; slot < numTimeslotsNeeded; slot++) {
      const slotPairings = placementPairings.slice(slot * maxLanes, (slot + 1) * maxLanes);
      // For the grand finale timeslot, sort ascending so Rank 1 vs 1 plays on Bahn 1!
      if (slot === numTimeslotsNeeded - 1) {
        slotPairings.sort((a, b) => a.rank - b.rank);
      }

      slotPairings.forEach((pair, idx) => {
        placementMatches.push({
          id: `m-platzierung-${pair.rank}-${matchCounter++}`,
          round: slot + 1,
          court: `Bahn ${idx + 1}`,
          teamAId: pair.teamAId,
          teamBId: pair.teamBId,
          teamAScore: null,
          teamBScore: null,
          status: "planned",
          phase: "platzierung",
          kehrenCount: 6, // 6 Kehren pro Spiel bei den Platzierungsspielen
          durchgang: nextDurchgang,
        });
      });
      nextDurchgang++;
    }

    const updatedMatches = [...vorrundeMatches, ...placementMatches];
    onUpdateTournament(activeTournament.id, { matches: updatedMatches });
  };

  // Add Team to active tournament
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !newTeamName.trim()) return;
    if (activeTournament.status !== "planned") {
      alert("In einem aktiven oder beendeten Turnier können keine Teams mehr hinzugefügt werden.");
      return;
    }

    const newTeam: Team = {
      id: "team-" + Date.now(),
      name: newTeamName.trim(),
      club: newTeamClub.trim() || undefined,
      players: newTeamPlayers
        ? newTeamPlayers.split(",").map((p) => p.trim())
        : undefined,
    };

    const updatedTeams = [...activeTournament.teams, newTeam];
    onUpdateTournament(activeTournament.id, { teams: updatedTeams });

    setNewTeamName("");
    setNewTeamClub("");
    setNewTeamPlayers("");
  };

  // Delete Team
  const handleDeleteTeam = (teamId: string) => {
    if (!activeTournament) return;
    if (activeTournament.status !== "planned") {
      alert("In einem aktiven oder beendeten Turnier können keine Teams mehr gelöscht werden.");
      return;
    }
    const updatedTeams = activeTournament.teams.filter((t) => t.id !== teamId);
    // Also remove matches involving this team
    const updatedMatches = activeTournament.matches.filter(
      (m) => m.teamAId !== teamId && m.teamBId !== teamId
    );
    onUpdateTournament(activeTournament.id, {
      teams: updatedTeams,
      matches: updatedMatches,
    });
  };

  // Start editing team
  const handleStartEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  };

  // Save team name
  const handleSaveTeamName = (teamId: string) => {
    if (!activeTournament || !editingTeamName.trim()) {
      setEditingTeamId(null);
      return;
    }
    const updatedTeams = activeTournament.teams.map((t) =>
      t.id === teamId ? { ...t, name: editingTeamName.trim() } : t
    );
    onUpdateTournament(activeTournament.id, { teams: updatedTeams });
    setEditingTeamId(null);
  };

  // Save duel club names
  const handleSaveDuelClubs = () => {
    if (!activeTournament) return;
    const currentConfig = activeTournament.clubDuelConfig || {
      teamsCountA: 3,
      teamsCountB: 3,
      roundsCount: 2,
      clubAName: "Mannschaft 1",
      clubBName: "Mannschaft 2",
    };
    const newA = editClubAName.trim() || currentConfig.clubAName;
    const newB = editClubBName.trim() || currentConfig.clubBName;

    // Also update team.club names for consistency
    const updatedTeams = activeTournament.teams.map((t) => {
      if (t.group === "A" || t.id.startsWith("team-a-") || t.club === currentConfig.clubAName) {
        return { ...t, club: newA };
      }
      if (t.group === "B" || t.id.startsWith("team-b-") || t.club === currentConfig.clubBName) {
        return { ...t, club: newB };
      }
      return t;
    });

    onUpdateTournament(activeTournament.id, {
      clubDuelConfig: {
        ...currentConfig,
        clubAName: newA,
        clubBName: newB,
      },
      teams: updatedTeams,
    });
    setEditingDuelClubs(false);
  };

  // Add Target Participant
  const handleAddTargetParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !newPlayerName.trim()) return;
    if (activeTournament.status !== "planned") {
      alert("In einem aktiven oder beendeten Turnier können keine Teilnehmer mehr hinzugefügt werden.");
      return;
    }

    const newParticipant: TargetParticipant = {
      id: "p-" + Date.now(),
      playerName: newPlayerName.trim(),
      clubName: newPlayerClub.trim() || "Kein Verein",
      scores: { round1: 0, round2: 0, round3: 0, round4: 0 },
      totalScore: 0,
    };

    const updatedParticipants = [
      ...activeTournament.targetParticipants,
      newParticipant,
    ];
    onUpdateTournament(activeTournament.id, {
      targetParticipants: updatedParticipants,
    });

    setNewPlayerName("");
    setNewPlayerClub("");
  };

  // Delete Target Participant
  const handleDeleteTargetParticipant = (pId: string) => {
    if (!activeTournament) return;
    if (activeTournament.status !== "planned") {
      alert("In einem aktiven oder beendeten Turnier können keine Teilnehmer mehr gelöscht werden.");
      return;
    }
    const updatedParticipants = activeTournament.targetParticipants.filter(
      (p) => p.id !== pId
    );
    onUpdateTournament(activeTournament.id, {
      targetParticipants: updatedParticipants,
    });
  };

  // Toggle tournament status (planned -> active -> completed)
  const handleToggleStatus = (status: "planned" | "active" | "completed") => {
    if (!activeTournament) return;
    onUpdateTournament(activeTournament.id, { status });
  };

  const handleListTabChange = (newTab: "active" | "archived") => {
    setListTab(newTab);
    const newFiltered = tournaments.filter(t => newTab === "active" ? !t.archived : !!t.archived);
    if (newFiltered.length > 0) {
      const isCurrentInNewList = newFiltered.some(t => t.id === activeTournament?.id);
      if (!isCurrentInNewList) {
        onSelectTournament(newFiltered[0].id);
      }
    }
  };

  return (
    <div className="space-y-6" id="tournaments-tab">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800" id="tourney-tab-heading">
            Turnier-Management
          </h2>
          <p className="text-xs text-slate-500">
            Erstellen und konfigurieren Sie hier Ihre Stocksport-Turniere.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-sm"
          id="btn-open-create-modal"
        >
          <Plus className="h-4 w-4" />
          Neues Turnier anlegen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tournament List */}
        <div className="space-y-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleListTabChange("active")}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                listTab === "active"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Aktiv ({tournaments.filter((t) => !t.archived).length})
            </button>
            <button
              onClick={() => handleListTabChange("archived")}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                listTab === "archived"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Archiv ({tournaments.filter((t) => !!t.archived).length})
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1" id="tournaments-sidebar-list">
            {filteredTournaments.map((tournament) => {
              const isActive = activeTournament?.id === tournament.id;
              return (
                <div
                  key={tournament.id}
                  onClick={() => onSelectTournament(tournament.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isActive
                      ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                  id={`list-item-tourney-${tournament.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        tournament.type === "duell"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : tournament.type === "team"
                          ? "bg-emerald-50 text-emerald-700"
                          : tournament.type === "target"
                          ? "bg-blue-50 text-blue-700"
                          : tournament.type === "distance"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {tournament.type === "duell" ? (
                        <>
                          <Swords className="h-2.5 w-2.5 text-rose-600" /> Vereinsvergleich
                        </>
                      ) : tournament.type === "team" ? (
                        <>
                          <Users className="h-2.5 w-2.5" /> Teambewerb
                        </>
                      ) : tournament.type === "target" ? (
                        <>
                          <Target className="h-2.5 w-2.5" /> Zielbewerb
                        </>
                      ) : tournament.type === "distance" ? (
                        <>
                          <Trophy className="h-2.5 w-2.5 text-amber-600" /> Weitenbewerb
                        </>
                      ) : (
                        <>
                          <Trophy className="h-2.5 w-2.5 text-purple-600" /> Special Olympics
                        </>
                      )}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        tournament.status === "active"
                          ? "bg-rose-50 text-rose-600 animate-pulse"
                          : tournament.status === "completed"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {tournament.status === "active"
                        ? "Live"
                        : tournament.status === "completed"
                        ? "Beendet"
                        : "Geplant"}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{tournament.name}</h4>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {tournament.date}
                    </span>
                    <span className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {tournament.location}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTournaments.length === 0 && (
              <div className="text-center py-8 text-slate-400 border border-dashed rounded-xl">
                {listTab === "active" ? "Keine aktiven Turniere vorhanden" : "Das Archiv ist leer"}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Detailed view / configuration */}
        <div className="lg:col-span-2">
          {activeTournament ? (
            <motion.div
              key={activeTournament.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6"
              id="tournament-detail-panel"
            >
              {/* Archive Banner */}
              {activeTournament.archived && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>Dieses Turnier befindet sich im Archiv. Sie können es wiederherstellen oder endgültig löschen.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onUpdateTournament(activeTournament.id, { archived: false })}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
                    >
                      Wiederherstellen
                    </button>
                    <button
                      onClick={() => setConfirmAction({
                        type: "delete",
                        tournamentId: activeTournament.id,
                        tournamentName: activeTournament.name,
                      })}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                    >
                      Endgültig löschen
                    </button>
                  </div>
                </div>
              )}

              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-600 font-semibold uppercase tracking-wider">
                      {activeTournament.type === "duell" ? "Vereinsvergleich (2 Mannschaften)" :
                       activeTournament.type === "team" ? "Teambewerb" :
                       activeTournament.type === "target" ? "Zielbewerb" :
                       activeTournament.type === "distance" ? "Weitenwettbewerb" : "Special Olympics"}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{activeTournament.location}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{activeTournament.name}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus("planned")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      activeTournament.status === "planned"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={activeTournament.archived}
                  >
                    Geplant
                  </button>
                  <button
                    onClick={() => handleToggleStatus("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      activeTournament.status === "active"
                        ? "bg-rose-500 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={activeTournament.archived}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                    Aktiv / Live
                  </button>
                  <button
                    onClick={() => handleToggleStatus("completed")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      activeTournament.status === "completed"
                        ? "bg-slate-700 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={activeTournament.archived}
                  >
                    Beendet
                  </button>

                  {!activeTournament.archived ? (
                    <button
                      onClick={() => setConfirmAction({
                        type: "archive",
                        tournamentId: activeTournament.id,
                        tournamentName: activeTournament.name,
                      })}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors ml-2"
                      title="In Archiv verschieben"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmAction({
                        type: "delete",
                        tournamentId: activeTournament.id,
                        tournamentName: activeTournament.name,
                      })}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                      title="Endgültig löschen"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* TURNIER-KONFIGURATION & FUNKTIONÄRE */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-slate-500" />
                  Turnier-Konfiguration & Funktionäre
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Regelwerk</label>
                    <select
                      value={activeTournament.rulesVersion || "legacy3579"}
                      onChange={(e) => onUpdateTournament(activeTournament.id, { rulesVersion: e.target.value as 'ier2022' | 'legacy3579' })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      disabled={isLocked}
                    >
                      <option value="legacy3579">Legacy (3/5/7/9 - Punkte, Differenz, Eigene)</option>
                      <option value="ier2022">IER 2022 (Punkte, Stocknote, Differenz, Eigene)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Landesverband / Durchführer</label>
                    <input
                      type="text"
                      placeholder="z.B. Landesverband Bayern"
                      value={activeTournament.association || ""}
                      onChange={(e) => onUpdateTournament(activeTournament.id, { association: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      disabled={isLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Wettbewerbsleiter</label>
                    <input
                      type="text"
                      placeholder="Name des Wettbewerbsleiters"
                      value={activeTournament.competitionLeader || ""}
                      onChange={(e) => onUpdateTournament(activeTournament.id, { competitionLeader: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      disabled={isLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Schiedsrichter</label>
                    <input
                      type="text"
                      placeholder="Name des Schiedsrichters"
                      value={activeTournament.referee || ""}
                      onChange={(e) => onUpdateTournament(activeTournament.id, { referee: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      disabled={isLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Schriftführer / Rechenbüro</label>
                    <input
                      type="text"
                      placeholder="Name des Schriftführers"
                      value={activeTournament.clerk || ""}
                      onChange={(e) => onUpdateTournament(activeTournament.id, { clerk: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      disabled={isLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Sponsoren-Logo / Banner URL</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="https://example.com/logo.png oder Base64"
                        value={activeTournament.sponsorImage || ""}
                        onChange={(e) => onUpdateTournament(activeTournament.id, { sponsorImage: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        disabled={isLocked || cachingSponsor}
                      />
                      {activeTournament.sponsorImage && (
                        <button
                          type="button"
                          onClick={handleCacheSponsorImage}
                          disabled={cachingSponsor || isLocked}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          {cachingSponsor ? (
                            <>
                              <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Cachen...
                            </>
                          ) : (
                            "Lokal cachen"
                          )}
                        </button>
                      )}
                    </div>
                    {/* STATUS & PREVIEW BOX */}
                    {activeTournament.sponsorImage && (
                      <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          {activeTournament.sponsorImage.startsWith("/cached-images/") ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              ✓ Erfolgreich lokal auf Server gecacht
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              ⚠️ Externes Bild (Klicken Sie auf 'Lokal cachen' zum Speichern)
                            </span>
                          )}
                          <span className="text-slate-400 font-mono">
                            {activeTournament.sponsorImage.startsWith("/cached-images/") ? "Lokaler Pfad" : "Externer Pfad"}
                          </span>
                        </div>

                        {cacheError && (
                          <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg">
                            {cacheError}
                          </p>
                        )}

                        {cacheSuccess && (
                          <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg">
                            ✓ Bild wurde erfolgreich heruntergeladen und lokal im Projektordner gespeichert!
                          </p>
                        )}

                        {/* Visual Image Preview */}
                        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                          <div className="h-14 w-24 shrink-0 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={activeTournament.sponsorImage.startsWith("/cached-images/") ? `${StockAPI.getBaseUrl()}${activeTournament.sponsorImage}` : activeTournament.sponsorImage}
                              alt="Sponsoren Logo"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-500 truncate" title={activeTournament.sponsorImage}>
                              {activeTournament.sponsorImage}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              Dieses Bild wird auf offiziellen Berichten, Ergebnislisten und Schiedsrichter-Wertungskarten im Kopfbereich gedruckt.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* VEREINSVERGLEICH (2-MANNSCHAFTEN-DUELL) MANAGEMENT */}
              {activeTournament.type === "duell" && (
                <div className="space-y-6">
                  {(() => {
                    const duelStats = computeClubDuelStats(activeTournament);
                    const clubA = activeTournament.clubDuelConfig?.clubAName || "Mannschaft 1";
                    const clubB = activeTournament.clubDuelConfig?.clubBName || "Mannschaft 2";
                    const teamsA = activeTournament.teams.filter(t => (t.group === "A" || t.id.startsWith("team-a-") || t.club === clubA || t.group === clubA || (clubA && t.name.toLowerCase().includes(clubA.toLowerCase()))));
                    const teamsB = activeTournament.teams.filter(t => !teamsA.some(ta => ta.id === t.id));
                    teamsA.sort((a, b) => a.id.localeCompare(b.id));
                    teamsB.sort((a, b) => a.id.localeCompare(b.id));

                    return (
                      <>
                        {/* Duel Summary Score Card */}
                        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-indigo-900/40 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/60 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <Swords className="h-4 w-4" />
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">
                                    Vereinsvergleich: {clubA} vs. {clubB}
                                  </h4>
                                  {!isLocked && (
                                    <button
                                      onClick={() => {
                                        setEditClubAName(clubA);
                                        setEditClubBName(clubB);
                                        setEditingDuelClubs(!editingDuelClubs);
                                      }}
                                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                      title="Vereinsnamen bearbeiten"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400">
                                  {activeTournament.clubDuelConfig?.roundsCount || 2} Durchgänge • {activeTournament.maxCourts || 3} Bahnen • {activeTournament.kehrenCount || 6} Kehren
                                </p>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-fit">
                              {duelStats?.completedMatches || 0} von {duelStats?.totalMatches || activeTournament.matches.length} Spielen absolviert
                            </span>
                          </div>

                          {/* Club Names Editor */}
                          {editingDuelClubs && (
                            <div className="bg-slate-900/90 border border-indigo-700/60 p-3 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                                <span className="text-[10px] text-indigo-300 font-bold uppercase shrink-0">Verein 1:</span>
                                <input
                                  type="text"
                                  value={editClubAName}
                                  onChange={(e) => setEditClubAName(e.target.value)}
                                  className="bg-slate-800 border border-indigo-500/60 rounded px-2 py-1 text-white font-bold text-xs w-full focus:outline-none"
                                  placeholder="Name Verein 1"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                                <span className="text-[10px] text-emerald-300 font-bold uppercase shrink-0">Verein 2:</span>
                                <input
                                  type="text"
                                  value={editClubBName}
                                  onChange={(e) => setEditClubBName(e.target.value)}
                                  className="bg-slate-800 border border-emerald-500/60 rounded px-2 py-1 text-white font-bold text-xs w-full focus:outline-none"
                                  placeholder="Name Verein 2"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleSaveDuelClubs}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="h-3.5 w-3.5" /> Speichern
                                </button>
                                <button
                                  onClick={() => setEditingDuelClubs(false)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs cursor-pointer"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Big Score Display */}
                          <div className="grid grid-cols-3 items-center gap-2 text-center py-2">
                            {/* Club A */}
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1">
                                {clubA}
                              </span>
                              <div className="text-3xl sm:text-5xl font-black font-mono text-white">
                                {duelStats?.clubAPoints || 0}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {duelStats?.clubAStockPoints || 0} Stöcke
                              </div>
                              <div className="text-[10px] text-cyan-400 font-mono font-bold">
                                Note: {duelStats?.clubAStockNote?.toFixed(3) || "0.000"}
                              </div>
                            </div>

                            {/* Middle VS */}
                            <div className="space-y-2">
                              <div className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                SPIELPUNKTE
                              </div>
                              <div className="text-xl sm:text-2xl font-black text-slate-600">:</div>
                              {duelStats && duelStats.completedMatches > 0 && (
                                <div className="text-[10px] font-extrabold px-2 py-1 rounded-md bg-white/10 text-amber-300 inline-block">
                                  {duelStats.leader === 'clubA' ? `🏆 Führung: ${clubA}` : duelStats.leader === 'clubB' ? `🏆 Führung: ${clubB}` : '🤝 Gleichstand'}
                                </div>
                              )}
                            </div>

                            {/* Club B */}
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                                {clubB}
                              </span>
                              <div className="text-3xl sm:text-5xl font-black font-mono text-white">
                                {duelStats?.clubBPoints || 0}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {duelStats?.clubBStockPoints || 0} Stöcke
                              </div>
                              <div className="text-[10px] text-cyan-400 font-mono font-bold">
                                Note: {duelStats?.clubBStockNote?.toFixed(3) || "0.000"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Teams in two columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Column Club A */}
                          <div className="space-y-3 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                              <div className="flex items-center gap-1.5">
                                <Shield className="h-4 w-4 text-indigo-600" />
                                <h4 className="font-bold text-slate-800 text-sm">
                                  {clubA} ({teamsA.length} Teams)
                                </h4>
                              </div>
                            </div>

                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {teamsA.map((team, idx) => (
                                <div
                                  key={team.id}
                                  className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white p-2 text-xs shadow-2xs group hover:border-indigo-300 transition-colors"
                                >
                                  {editingTeamId === team.id ? (
                                    <div className="flex items-center gap-1.5 flex-1 pr-1">
                                      <span className="font-bold text-indigo-900 shrink-0">{idx + 1}.</span>
                                      <input
                                        type="text"
                                        value={editingTeamName}
                                        onChange={(e) => setEditingTeamName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleSaveTeamName(team.id);
                                          if (e.key === "Escape") setEditingTeamId(null);
                                        }}
                                        className="font-bold text-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs bg-indigo-50/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                                        placeholder="Teamname anpassen..."
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveTeamName(team.id)}
                                        className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                        title="Speichern (Enter)"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingTeamId(null)}
                                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                        title="Abbrechen (Esc)"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex-1 pr-2 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-bold text-indigo-950 truncate">
                                            {idx + 1}. {team.name}
                                          </p>
                                          {!isLocked && (
                                            <button
                                              onClick={() => handleStartEditTeam(team)}
                                              className="text-slate-300 hover:text-indigo-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                              title="Teamname anpassen"
                                            >
                                              <Pencil className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                        {team.players && team.players.length > 0 && (
                                          <p className="text-[10px] text-slate-400 truncate">
                                            {team.players.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                      {!isLocked && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => handleStartEditTeam(team)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer sm:hidden"
                                            title="Teamname anpassen"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                            title="Team löschen"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                              {teamsA.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-xs">
                                  Noch keine Teams für {clubA} angelegt
                                </div>
                              )}
                            </div>

                            {!isLocked && (
                              <button
                                onClick={() => {
                                  const nextIdx = teamsA.length + 1;
                                  const newTeamId = "team-a-" + Date.now();
                                  const defaultName = clubA ? `${clubA} ${nextIdx}` : `Team ${nextIdx}`;
                                  const newTeam: Team = {
                                    id: newTeamId,
                                    name: defaultName,
                                    club: clubA,
                                    group: "A",
                                  };
                                  onUpdateTournament(activeTournament.id, {
                                    teams: [...activeTournament.teams, newTeam],
                                  });
                                  setEditingTeamId(newTeamId);
                                  setEditingTeamName(defaultName);
                                }}
                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" /> Team für {clubA} hinzufügen
                              </button>
                            )}
                          </div>

                          {/* Column Club B */}
                          <div className="space-y-3 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                              <div className="flex items-center gap-1.5">
                                <Shield className="h-4 w-4 text-emerald-600" />
                                <h4 className="font-bold text-slate-800 text-sm">
                                  {clubB} ({teamsB.length} Teams)
                                </h4>
                              </div>
                            </div>

                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {teamsB.map((team, idx) => (
                                <div
                                  key={team.id}
                                  className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white p-2 text-xs shadow-2xs group hover:border-emerald-300 transition-colors"
                                >
                                  {editingTeamId === team.id ? (
                                    <div className="flex items-center gap-1.5 flex-1 pr-1">
                                      <span className="font-bold text-emerald-900 shrink-0">{idx + 1}.</span>
                                      <input
                                        type="text"
                                        value={editingTeamName}
                                        onChange={(e) => setEditingTeamName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleSaveTeamName(team.id);
                                          if (e.key === "Escape") setEditingTeamId(null);
                                        }}
                                        className="font-bold text-slate-900 border border-emerald-500 rounded px-2 py-0.5 text-xs bg-emerald-50/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                                        placeholder="Teamname anpassen..."
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveTeamName(team.id)}
                                        className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                        title="Speichern (Enter)"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingTeamId(null)}
                                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                        title="Abbrechen (Esc)"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex-1 pr-2 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-bold text-emerald-950 truncate">
                                            {idx + 1}. {team.name}
                                          </p>
                                          {!isLocked && (
                                            <button
                                              onClick={() => handleStartEditTeam(team)}
                                              className="text-slate-300 hover:text-emerald-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                              title="Teamname anpassen"
                                            >
                                              <Pencil className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                        {team.players && team.players.length > 0 && (
                                          <p className="text-[10px] text-slate-400 truncate">
                                            {team.players.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                      {!isLocked && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => handleStartEditTeam(team)}
                                            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer sm:hidden"
                                            title="Teamname anpassen"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                            title="Team löschen"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                              {teamsB.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-xs">
                                  Noch keine Teams für {clubB} angelegt
                                </div>
                              )}
                            </div>

                            {!isLocked && (
                              <button
                                onClick={() => {
                                  const nextIdx = teamsB.length + 1;
                                  const newTeamId = "team-b-" + Date.now();
                                  const defaultName = clubB ? `${clubB} ${nextIdx}` : `Team ${nextIdx}`;
                                  const newTeam: Team = {
                                    id: newTeamId,
                                    name: defaultName,
                                    club: clubB,
                                    group: "B",
                                  };
                                  onUpdateTournament(activeTournament.id, {
                                    teams: [...activeTournament.teams, newTeam],
                                  });
                                  setEditingTeamId(newTeamId);
                                  setEditingTeamName(defaultName);
                                }}
                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" /> Team für {clubB} hinzufügen
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Matches Schedule Generation */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <Swords className="h-4 w-4 text-rose-600" />
                                Spielplan für Vereinsvergleich
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Erzeugt für alle {activeTournament.clubDuelConfig?.roundsCount || 2} Durchgänge faire Duelle zwischen {clubA} und {clubB} auf {activeTournament.maxCourts || 3} Bahnen.
                              </p>
                            </div>

                            <button
                              onClick={handleGenerateSchedule}
                              disabled={teamsA.length === 0 || teamsB.length === 0 || isLocked}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 text-white px-4 py-2 text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
                              id="btn-generate-duel-schedule"
                            >
                              <Shuffle className="h-3.5 w-3.5" />
                              Spielplan generieren
                            </button>
                          </div>

                          {activeTournament.matches.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                                <span className="text-xs font-semibold text-slate-700">
                                  Spielplan aktiv: {activeTournament.matches.length} Duelle generiert.
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                {activeTournament.matches.map((match) => {
                                  const teamA = activeTournament.teams.find((t) => t.id === match.teamAId);
                                  const teamB = activeTournament.teams.find((t) => t.id === match.teamBId);
                                  const isTeamA_ClubA = teamA?.club === clubA || teamA?.group === clubA;
                                  return (
                                    <div
                                      key={match.id}
                                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                            R {match.round}
                                          </span>
                                          <span className="text-[9px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                            {match.court}
                                          </span>
                                          {match.durchgang && (
                                            <span className="text-[9px] font-bold text-slate-600 bg-slate-200/50 px-1.5 py-0.5 rounded">
                                              Dg. {match.durchgang}
                                            </span>
                                          )}
                                        </div>
                                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            isTeamA_ClubA ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                                          }`}>
                                            {teamA?.name || "Unbekannt"}
                                          </span>
                                          <span className="text-slate-400 font-normal">vs</span>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            !isTeamA_ClubA ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                                          }`}>
                                            {teamB?.name || "Unbekannt"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        {match.status === "completed" ? (
                                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                            {match.teamAScore}:{match.teamBScore}
                                          </span>
                                        ) : match.status === "active" ? (
                                          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded uppercase tracking-wider animate-pulse">
                                            Spielt
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400">Offen</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                              <AlertCircle className="mx-auto h-5 w-5 text-slate-400 mb-1.5" />
                              Noch kein Spielplan generiert. Klicken Sie oben auf "Spielplan generieren", um alle Duelle auf die Bahnen zu verteilen.
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TEAM BEWERB MANAGEMENT */}
              {activeTournament.type === "team" && (
                <div className="space-y-6">
                  {/* Grid for Teams list & Team form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add Team form */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-indigo-600" />
                        Mannschaft hinzufügen
                      </h4>

                      <form onSubmit={handleAddTeam} className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Mannschaftsname *</label>
                          <input
                            type="text"
                            required
                            placeholder="z.B. EV Altheim"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            disabled={isLocked}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Verein (Optional)</label>
                          <input
                            type="text"
                            placeholder="z.B. SV Altheim"
                            value={newTeamClub}
                            onChange={(e) => setNewTeamClub(e.target.value)}
                            disabled={isLocked}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Spieler (Optional, Komma-getrennt)</label>
                          <input
                            type="text"
                            placeholder="Spieler 1, Spieler 2, Spieler 3, Spieler 4"
                            value={newTeamPlayers}
                            onChange={(e) => setNewTeamPlayers(e.target.value)}
                            disabled={isLocked}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                          <p className="mt-1 text-[10px] text-slate-400">Geben Sie bis zu 4 Spielernamen ein.</p>
                        </div>

                        <button
                          type="submit"
                          disabled={isLocked}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3.5 w-3.5" /> Team speichern
                        </button>
                      </form>
                    </div>

                    {/* Teams list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-sm">
                          Mannschaften ({activeTournament.teams.length})
                        </h4>
                      </div>

                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                        {activeTournament.teams.map((team, idx) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2.5 text-xs hover:border-slate-200 transition-colors group"
                          >
                            {editingTeamId === team.id ? (
                              <div className="flex items-center gap-1.5 flex-1 pr-1">
                                <span className="font-bold text-slate-700 shrink-0">{idx + 1}.</span>
                                <input
                                  type="text"
                                  value={editingTeamName}
                                  onChange={(e) => setEditingTeamName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveTeamName(team.id);
                                    if (e.key === "Escape") setEditingTeamId(null);
                                  }}
                                  className="font-bold text-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                                  placeholder="Teamname anpassen..."
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveTeamName(team.id)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                  title="Speichern"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingTeamId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Abbrechen"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-0.5 flex-1 pr-2 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-slate-800 truncate">
                                      {idx + 1}. {team.name}
                                    </p>
                                    {!isLocked && (
                                      <button
                                        onClick={() => handleStartEditTeam(team)}
                                        className="text-slate-300 hover:text-indigo-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                        title="Teamname bearbeiten"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  {team.players && team.players.length > 0 && (
                                    <p className="text-[10px] text-slate-400 line-clamp-1">
                                      {team.players.join(", ")}
                                    </p>
                                  )}
                                  {activeTournament.isSpecialThreeLaneMode && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                        team.group === "Gruppe B" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                                      }`}>
                                        {team.group || "Gruppe A"}
                                      </span>
                                      <select
                                        value={team.group || "Gruppe A"}
                                        disabled={isLocked}
                                        onChange={(e) => {
                                          const updatedTeams = activeTournament.teams.map((t) =>
                                            t.id === team.id ? { ...t, group: e.target.value } : t
                                          );
                                          onUpdateTournament(activeTournament.id, { teams: updatedTeams });
                                        }}
                                        className="text-[9px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        <option value="Gruppe A">Gruppe A</option>
                                        <option value="Gruppe B">Gruppe B</option>
                                      </select>
                                    </div>
                                  )}
                                </div>

                                {!isLocked && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleStartEditTeam(team)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer sm:hidden"
                                      title="Teamname bearbeiten"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTeam(team.id)}
                                      className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                      title="Team löschen"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}

                        {activeTournament.teams.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            Noch keine Mannschaften angelegt
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matches Schedule Generation */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Shuffle className="h-4 w-4 text-indigo-600" />
                          {activeTournament.isSpecialThreeLaneMode ? "Spezial-Spielplan (Vorrunde & Platzierungsspiele)" : "Spielplan (Round Robin)"}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {activeTournament.isSpecialThreeLaneMode
                            ? "Vorrunde mit 4 Kehren pro Spiel auf max. 3 Bahnen. Platzierungsspiele mit 6 Kehren."
                            : `Generiert automatisch einen Jeder-gegen-Jeden-Spielplan für alle ${activeTournament.teams.length} Mannschaften.`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleGenerateSchedule}
                          disabled={activeTournament.teams.length < 2 || isLocked}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-600 px-4 py-2 text-xs font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          id="btn-generate-schedule"
                        >
                          <Shuffle className="h-3.5 w-3.5" />
                          {activeTournament.isSpecialThreeLaneMode ? "Vorrunde generieren" : "Spielplan generieren"}
                        </button>

                        {activeTournament.isSpecialThreeLaneMode && activeTournament.matches.length > 0 && !activeTournament.matches.some((m) => m.phase === "platzierung") && (
                          <button
                            onClick={handleGeneratePlacementMatches}
                            disabled={activeTournament.status === "completed"}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-50 text-purple-700 px-4 py-2 text-xs font-semibold hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-purple-100 animate-pulse"
                            id="btn-generate-placement"
                          >
                            <Trophy className="h-3.5 w-3.5" /> Platzierungsspiele generieren
                          </button>
                        )}
                      </div>
                    </div>

                    {activeTournament.matches.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-slate-700">
                            Spielplan aktiv: {activeTournament.matches.length} Spiele generiert.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                          {activeTournament.matches.map((match) => {
                            const teamA = activeTournament.teams.find((t) => t.id === match.teamAId)?.name || "Unbekannt";
                            const teamB = activeTournament.teams.find((t) => t.id === match.teamBId)?.name || "Unbekannt";
                            return (
                              <div
                                key={match.id}
                                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                      R {match.round}
                                    </span>
                                    {match.phase && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                        match.phase === "vorrunde"
                                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                                          : "bg-purple-50 text-purple-700 border border-purple-100"
                                      }`}>
                                        {match.phase === "vorrunde" ? "Vorrunde" : "Platzierung"}
                                      </span>
                                    )}
                                    <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                      {match.kehrenCount || 6}K
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-bold">{match.court}</span>
                                    {match.durchgang && (
                                      <span className="text-[9px] font-bold text-slate-600 bg-slate-200/40 px-1 py-0.5 rounded">
                                        Dg. {match.durchgang}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-semibold text-slate-700">
                                    {teamA} <span className="text-slate-400 font-normal">vs</span> {teamB}
                                  </div>
                                </div>

                                <div className="text-right">
                                  {match.status === "completed" ? (
                                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                      {match.teamAScore}:{match.teamBScore}
                                    </span>
                                  ) : match.status === "active" ? (
                                    <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded uppercase tracking-wider animate-pulse">
                                      Spielt
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Offen</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                        <AlertCircle className="mx-auto h-5 w-5 text-slate-400 mb-1.5" />
                        Noch kein Spielplan generiert. Fügen Sie Mannschaften hinzu und klicken Sie auf "Spielplan generieren".
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ZIELBEWERB / WEITENWETTBEWERB / SPECIAL OLYMPICS MANAGEMENT */}
              {(activeTournament.type === "target" || activeTournament.type === "distance" || activeTournament.type === "special-olympics") && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add Player form */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-indigo-600" />
                        Teilnehmer hinzufügen
                      </h4>

                      <form onSubmit={handleAddTargetParticipant} className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Spielername *</label>
                          <input
                            type="text"
                            required
                            placeholder="z.B. Franz Huber"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            disabled={isLocked}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase">Verein (Optional)</label>
                          <input
                            type="text"
                            placeholder="z.B. EV Altheim"
                            value={newPlayerClub}
                            onChange={(e) => setNewPlayerClub(e.target.value)}
                            disabled={isLocked}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>

                        {activeTournament.type === "special-olympics" && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 uppercase">Special Olympics Level</label>
                            <select
                              value={newSpecialOlympicsLevel}
                              onChange={(e) => setNewSpecialOlympicsLevel(e.target.value)}
                              disabled={isLocked}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                              <option value="Level I">Level I (Individual Skills)</option>
                              <option value="Level II">Level II</option>
                              <option value="Level III">Level III</option>
                              <option value="Level IV">Level IV</option>
                              <option value="Level V">Level V</option>
                            </select>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isLocked}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed animate-none"
                        >
                          <Plus className="h-3.5 w-3.5" /> Spieler speichern
                        </button>
                      </form>
                    </div>

                    {/* Participants list */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm">
                        Teilnehmer ({activeTournament.targetParticipants.length})
                      </h4>

                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {activeTournament.targetParticipants.map((participant, idx) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2.5 text-xs hover:border-slate-200 transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-800">
                                {idx + 1}. {participant.playerName}
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>{participant.clubName}</span>
                                {participant.specialOlympicsLevel && (
                                  <>
                                    <span>•</span>
                                    <span className="text-purple-600 font-semibold">{participant.specialOlympicsLevel}</span>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {participant.totalScore} Pkt.
                              </span>
                              {!isLocked && (
                                <button
                                  onClick={() => handleDeleteTargetParticipant(participant.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {activeTournament.targetParticipants.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            Noch keine Teilnehmer angelegt
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full min-h-[300px] rounded-2xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Trophy className="h-10 w-10 text-slate-300 mb-2" />
              <h3 className="font-semibold text-slate-700 text-sm">Kein Turnier ausgewählt</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Wählen Sie links ein Turnier aus, um Teams zu verwalten, Spielpläne zu erstellen und den Status zu ändern.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="create-tourney-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-indigo-600" />
                  Neues Turnier erstellen
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  Abbrechen
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 uppercase">Turniername *</label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Meisterschaft Region Süd"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 uppercase">Bewerb-Typ *</label>
                    <select
                      value={type}
                      onChange={(e) => {
                        const newType = e.target.value as TournamentType;
                        setType(newType);
                        if (newType === "duell" && (!name || name.trim() === "Neues Turnier")) {
                          const a = duelClubA.trim() || "Mannschaft 1";
                          const b = duelClubB.trim() || "Mannschaft 2";
                          setName(`Vereinsvergleich: ${a} vs. ${b}`);
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white font-semibold"
                    >
                      <option value="team">🏆 Teambewerb (Standard)</option>
                      <option value="duell">⚔️ Vereinsvergleich / 2-Mannschaften-Duell</option>
                      <option value="target">🎯 Zielbewerb</option>
                      <option value="distance">🚀 Weitenwettbewerb</option>
                      <option value="special-olympics">🏅 Special Olympics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-500 uppercase">Datum *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* VEREINSVERGLEICH CONFIGURATION IN MODAL */}
                {type === "duell" && (
                  <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 space-y-3">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                      <Swords className="h-4 w-4" />
                      <span>Vereinsvergleich / Duell-Konfiguration</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Zwei Mannschaften / Vereine mit je mehreren Teams spielen gegeneinander. 
                      Keine vereinsinternen Duelle – jedes Team spielt gegen alle gegnerischen Teams!
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <label className="block text-[10px] font-bold text-indigo-700 uppercase">Verein / Mannschaft 1</label>
                        <input
                          type="text"
                          placeholder="Name Mannschaft 1 (z. B. Verein A)"
                          value={duelClubA}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDuelClubA(val);
                            if (!name || name.startsWith("Vereinsvergleich:")) {
                              const a = val.trim() || "Mannschaft 1";
                              const b = duelClubB.trim() || "Mannschaft 2";
                              setName(`Vereinsvergleich: ${a} vs. ${b}`);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                        />
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500 text-[10px]">Teams:</span>
                          <select
                            value={duelTeamsCountA}
                            onChange={(e) => setDuelTeamsCountA(parseInt(e.target.value) || 1)}
                            className="rounded border border-slate-200 px-2 py-0.5 text-xs font-bold bg-slate-50"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                              <option key={n} value={n}>{n} Teams</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <label className="block text-[10px] font-bold text-emerald-700 uppercase">Verein / Mannschaft 2</label>
                        <input
                          type="text"
                          placeholder="Name Mannschaft 2 (z. B. Verein B)"
                          value={duelClubB}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDuelClubB(val);
                            if (!name || name.startsWith("Vereinsvergleich:")) {
                              const a = duelClubA.trim() || "Mannschaft 1";
                              const b = val.trim() || "Mannschaft 2";
                              setName(`Vereinsvergleich: ${a} vs. ${b}`);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                        />
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500 text-[10px]">Teams:</span>
                          <select
                            value={duelTeamsCountB}
                            onChange={(e) => setDuelTeamsCountB(parseInt(e.target.value) || 1)}
                            className="rounded border border-slate-200 px-2 py-0.5 text-xs font-bold bg-slate-50"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                              <option key={n} value={n}>{n} Teams</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block font-semibold text-slate-600 uppercase text-[10px]">Durchgänge *</label>
                        <select
                          value={duelRoundsCount}
                          onChange={(e) => setDuelRoundsCount(parseInt(e.target.value) || 1)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                        >
                          <option value={1}>1 Durchgang (Einfache Runde)</option>
                          <option value={2}>2 Durchgänge (Hin- & Rückrunde)</option>
                          <option value={3}>3 Durchgänge</option>
                          <option value={4}>4 Durchgänge</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 uppercase text-[10px]">Verfügbare Bahnen *</label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={maxCourts}
                          onChange={(e) => setMaxCourts(parseInt(e.target.value) || 3)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Fairness Hinweis */}
                    <div className="p-2 rounded-lg bg-indigo-50/80 border border-indigo-100 text-[10px] text-indigo-900 leading-snug flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold shrink-0">⚖️ Fairness-Regel:</span>
                      <span>In Durchgang 1 bleiben die Teams von Mannschaft 1 fest auf ihren Bahnen. In Durchgang 2 bleiben die Teams von Mannschaft 2 fest auf ihren Bahnen.</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-500 uppercase">Veranstaltungsort</label>
                  <input
                    type="text"
                    placeholder="z.B. Stocksporthalle Passau"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 uppercase">Regelwerk</label>
                    <select
                      value={rulesVersion}
                      onChange={(e) => setRulesVersion(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="legacy3579">Legacy (3/5/7/9)</option>
                      <option value="ier2022">IER 2022 (Quotient)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-500 uppercase">Landesverband</label>
                    <input
                      type="text"
                      placeholder="z.B. LV Bayern"
                      value={association}
                      onChange={(e) => setAssociation(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-500 uppercase text-[9px]">Wettbewerbsleiter</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={competitionLeader}
                      onChange={(e) => setCompetitionLeader(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 uppercase text-[9px]">Schiedsrichter</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={referee}
                      onChange={(e) => setReferee(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 uppercase text-[9px]">Schriftführer</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={clerk}
                      onChange={(e) => setClerk(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {type === "team" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <label className="block font-bold text-slate-700 text-xs">3-Bahnen Spezial-Modus</label>
                        <p className="text-[10px] text-slate-400 leading-normal max-w-[240px]">Vorrunde mit 4 Kehren, Platzierungsspiele mit 6 Kehren. Max. 3 Bahnen.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSpecialThreeLaneMode}
                        onChange={(e) => {
                          setIsSpecialThreeLaneMode(e.target.checked);
                          if (e.target.checked) {
                            setMaxCourts(3);
                            setKehrenCount(4);
                          }
                        }}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {!isSpecialThreeLaneMode && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-500 uppercase text-[10px]">Kehren pro Spiel</label>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={kehrenCount}
                            onChange={(e) => setKehrenCount(parseInt(e.target.value) || 6)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-500 uppercase text-[10px]">Max. Bahnen</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={maxCourts}
                            onChange={(e) => setMaxCourts(parseInt(e.target.value) || 3)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <Trophy className="h-4 w-4" /> Turnier anlegen
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  confirmAction.type === "delete" 
                    ? "bg-rose-50 text-rose-600" 
                    : "bg-amber-50 text-amber-600"
                }`}>
                  {confirmAction.type === "delete" ? (
                    <Trash2 className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {confirmAction.type === "delete" ? "Turnier unwiderruflich löschen?" : "Turnier archivieren?"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {confirmAction.type === "delete" 
                      ? `Sind Sie sicher, dass Sie das Turnier "${confirmAction.tournamentName}" endgültig und unwiderruflich löschen möchten? Alle zugehörigen Spieldaten gehen verloren.`
                      : `Möchten Sie das Turnier "${confirmAction.tournamentName}" archivieren? Es kann im Archiv wiedergefunden und wiederhergestellt werden.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmAction.type === "delete") {
                      onDeleteTournament(confirmAction.tournamentId);
                    } else if (confirmAction.type === "archive") {
                      onUpdateTournament(confirmAction.tournamentId, { archived: true });
                    }
                    setConfirmAction(null);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-white text-xs font-bold transition-colors ${
                    confirmAction.type === "delete"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {confirmAction.type === "delete" ? "Endgültig löschen" : "Archivieren"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
