import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Check,
  Edit2,
  Users,
  Target,
  Trophy,
  X,
  Plus,
  Minus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Tournament, Match, TargetParticipant, TargetRoundScore, DistanceAttempt, SpecialOlympicsRound } from "../types";

interface LiveEntryTabProps {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  onSelectTournament: (id: string) => void;
  onEnterMatchScore: (
    tourneyId: string,
    matchId: string,
    scoreA: number,
    scoreB: number,
    status: "active" | "completed",
    isDQ?: boolean,
    dqTeamId?: string,
    isAbsent?: boolean,
    absentTeamId?: string
  ) => void;
  onEnterTargetScore: (
    tourneyId: string,
    participantId: string,
    scores: { round1?: number; round2?: number; round3?: number; round4?: number },
    rounds?: TargetRoundScore[],
    distanceAttempts?: DistanceAttempt[],
    specialOlympicsRounds?: SpecialOlympicsRound[],
    specialOlympicsLevel?: string,
    totalScore?: number
  ) => void;
}

export default function LiveEntryTab({
  tournaments,
  activeTournament,
  onSelectTournament,
  onEnterMatchScore,
  onEnterTargetScore,
}: LiveEntryTabProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<TargetParticipant | null>(null);

  // Score temp state for Match entry
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [matchStatus, setMatchStatus] = useState<"active" | "completed">("completed");

  // Match incident state
  const [isDQ, setIsDQ] = useState<boolean>(false);
  const [dqTeamId, setDqTeamId] = useState<string>("");
  const [isAbsent, setIsAbsent] = useState<boolean>(false);
  const [absentTeamId, setAbsentTeamId] = useState<string>("");

  // Advanced Participant state
  const [activeRoundNumber, setActiveRoundNumber] = useState<number>(1);

  // Target sub-round inputs
  const [round1, setRound1] = useState<number>(0);
  const [round2, setRound2] = useState<number>(0);
  const [round3, setRound3] = useState<number>(0);
  const [round4, setRound4] = useState<number>(0);

  // Distance sub-round attempts (5 attempts)
  const [distanceAttempts, setDistanceAttempts] = useState<{ distance: string; isValid: boolean }[]>([
    { distance: "", isValid: true },
    { distance: "", isValid: true },
    { distance: "", isValid: true },
    { distance: "", isValid: true },
    { distance: "", isValid: true },
  ]);

  // Special Olympics attempts (8 attempts)
  const [specialOlympicsScores, setSpecialOlympicsScores] = useState<number[]>(new Array(8).fill(0));

  // Filtering matches
  const [filterRound, setFilterRound] = useState<number>(0); // 0 means all rounds
  const [filterCourt, setFilterCourt] = useState<string>(""); // empty means all courts
  const [filterPhase, setFilterPhase] = useState<string>(""); // empty means all, 'vorrunde', 'platzierung'

  const activeTournaments = tournaments.filter((t) => t.status === "active");

  const handleOpenMatchScore = (match: Match) => {
    setSelectedMatch(match);
    setScoreA(match.teamAScore || 0);
    setScoreB(match.teamBScore || 0);
    setMatchStatus(match.status === "active" ? "active" : "completed");
    setIsDQ(match.isDQ || false);
    setDqTeamId(match.dqTeamId || "");
    setIsAbsent(match.isAbsent || false);
    setAbsentTeamId(match.absentTeamId || "");
  };

  const handleSaveMatchScore = () => {
    if (!activeTournament || !selectedMatch) return;
    onEnterMatchScore(
      activeTournament.id,
      selectedMatch.id,
      scoreA,
      scoreB,
      matchStatus,
      isDQ,
      isDQ ? dqTeamId : undefined,
      isAbsent,
      isAbsent ? absentTeamId : undefined
    );
    setSelectedMatch(null);
  };

  const handleOpenParticipantScore = (p: TargetParticipant) => {
    setSelectedParticipant(p);
    loadParticipantRoundData(p, 1);
  };

  const loadParticipantRoundData = (participant: TargetParticipant, roundNum: number) => {
    setActiveRoundNumber(roundNum);

    if (activeTournament?.type === "target") {
      const foundRound = participant.rounds?.find((r) => r.roundIndex === roundNum);
      setRound1(foundRound?.pass1 !== undefined ? foundRound.pass1 : (roundNum === 1 ? participant.scores.round1 || 0 : 0));
      setRound2(foundRound?.pass2 !== undefined ? foundRound.pass2 : (roundNum === 1 ? participant.scores.round2 || 0 : 0));
      setRound3(foundRound?.pass3 !== undefined ? foundRound.pass3 : (roundNum === 1 ? participant.scores.round3 || 0 : 0));
      setRound4(foundRound?.pass4 !== undefined ? foundRound.pass4 : (roundNum === 1 ? participant.scores.round4 || 0 : 0));
    } else if (activeTournament?.type === "distance") {
      const foundRound = participant.distanceAttempts?.find((r) => r.roundIndex === roundNum);
      if (foundRound) {
        setDistanceAttempts([
          { distance: foundRound.attempt1 !== null ? foundRound.attempt1.toString() : "", isValid: foundRound.attempt1 !== null },
          { distance: foundRound.attempt2 !== null ? foundRound.attempt2.toString() : "", isValid: foundRound.attempt2 !== null },
          { distance: foundRound.attempt3 !== null ? foundRound.attempt3.toString() : "", isValid: foundRound.attempt3 !== null },
          { distance: foundRound.attempt4 !== null ? foundRound.attempt4.toString() : "", isValid: foundRound.attempt4 !== null },
          { distance: foundRound.attempt5 !== null ? foundRound.attempt5.toString() : "", isValid: foundRound.attempt5 !== null },
        ]);
      } else {
        setDistanceAttempts(new Array(5).fill(null).map(() => ({ distance: "", isValid: true })));
      }
    } else if (activeTournament?.type === "special-olympics") {
      const foundRound = participant.specialOlympicsRounds?.find((r) => r.roundIndex === roundNum);
      if (foundRound) {
        setSpecialOlympicsScores(
          new Array(8).fill(0).map((_, i) => {
            const att = foundRound.attempts.find((a) => a.attemptIndex === i + 1);
            return att ? att.score : 0;
          })
        );
      } else {
        setSpecialOlympicsScores(new Array(8).fill(0));
      }
    }
  };

  const handleSaveParticipantScore = () => {
    if (!activeTournament || !selectedParticipant) return;

    let updatedScores = { ...selectedParticipant.scores };
    let updatedRounds = [...(selectedParticipant.rounds || [])];
    let updatedDistanceAttempts = [...(selectedParticipant.distanceAttempts || [])];
    let updatedSpecialOlympicsRounds = [...(selectedParticipant.specialOlympicsRounds || [])];
    let computedTotalScore = 0;

    if (activeTournament.type === "target") {
      const roundSum = round1 + round2 + round3 + round4;
      const roundData: TargetRoundScore = {
        roundIndex: activeRoundNumber,
        pass1: round1,
        pass2: round2,
        pass3: round3,
        pass4: round4,
        total: roundSum,
      };
      const rIdx = updatedRounds.findIndex((r) => r.roundIndex === activeRoundNumber);
      if (rIdx !== -1) {
        updatedRounds[rIdx] = roundData;
      } else {
        updatedRounds.push(roundData);
      }

      // Backward compatibility: round 1 syncs back to scores
      const r1 = updatedRounds.find((r) => r.roundIndex === 1);
      if (r1) {
        updatedScores = {
          round1: r1.pass1,
          round2: r1.pass2,
          round3: r1.pass3,
          round4: r1.pass4,
        };
      }

      // Sum of all rounds
      computedTotalScore = updatedRounds.reduce((sum, r) => sum + r.total, 0);
    } else if (activeTournament.type === "distance") {
      const getVal = (index: number) => {
        const da = distanceAttempts[index];
        return da.isValid && da.distance !== "" && !isNaN(parseFloat(da.distance)) ? parseFloat(da.distance) : null;
      };

      const val1 = getVal(0);
      const val2 = getVal(1);
      const val3 = getVal(2);
      const val4 = getVal(3);
      const val5 = getVal(4);

      const allVals = [val1, val2, val3, val4, val5].filter((v): v is number => v !== null);
      const bestVal = allVals.length > 0 ? Math.max(...allVals) : 0;
      const totalVal = allVals.reduce((sum, v) => sum + v, 0);

      const roundData: DistanceAttempt = {
        roundIndex: activeRoundNumber,
        attempt1: val1,
        attempt2: val2,
        attempt3: val3,
        attempt4: val4,
        attempt5: val5,
        best: bestVal,
        total: totalVal,
      };

      const rIdx = updatedDistanceAttempts.findIndex((r) => r.roundIndex === activeRoundNumber);
      if (rIdx !== -1) {
        updatedDistanceAttempts[rIdx] = roundData;
      } else {
        updatedDistanceAttempts.push(roundData);
      }

      // Distance score is the maximum best attempt among all rounds
      let maxDistance = 0;
      updatedDistanceAttempts.forEach((rd) => {
        if (rd.best > maxDistance) {
          maxDistance = rd.best;
        }
      });
      computedTotalScore = maxDistance;
    } else if (activeTournament.type === "special-olympics") {
      const attempts = specialOlympicsScores.map((score, index) => ({
        attemptIndex: index + 1,
        score,
      }));

      const roundSum = specialOlympicsScores.reduce((sum, s) => sum + s, 0);

      const roundData: SpecialOlympicsRound = {
        roundIndex: activeRoundNumber,
        attempts,
        total: roundSum,
      };

      const rIdx = updatedSpecialOlympicsRounds.findIndex((r) => r.roundIndex === activeRoundNumber);
      if (rIdx !== -1) {
        updatedSpecialOlympicsRounds[rIdx] = roundData;
      } else {
        updatedSpecialOlympicsRounds.push(roundData);
      }

      // Special Olympics is the sum of all rounds' scores
      computedTotalScore = updatedSpecialOlympicsRounds.reduce((sum, rd) => sum + rd.total, 0);
    }

    onEnterTargetScore(
      activeTournament.id,
      selectedParticipant.id,
      updatedScores,
      updatedRounds,
      updatedDistanceAttempts,
      updatedSpecialOlympicsRounds,
      selectedParticipant.specialOlympicsLevel,
      computedTotalScore
    );

    setSelectedParticipant(null);
  };

  // Helpers for filtering
  const roundsList = activeTournament && activeTournament.type === "team"
    ? Array.from(new Set(activeTournament.matches.map((m) => m.round))).sort((a, b) => a - b)
    : [];

  const courtsList = activeTournament && activeTournament.type === "team"
    ? Array.from(new Set(activeTournament.matches.map((m) => m.court))).sort()
    : [];

  return (
    <div className="space-y-6" id="live-entry-tab">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800" id="live-entry-heading">
            Live-Ergebniseingabe
          </h2>
          <p className="text-xs text-slate-500">
            Erfassen Sie die Ergebnisse live auf dem Platz. Die Auswertungen und Tabellen aktualisieren sich sofort.
          </p>
        </div>

        {/* Active tournament selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">Aktives Turnier:</span>
          <select
            value={activeTournament?.id || ""}
            onChange={(e) => onSelectTournament(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            id="active-tourney-dropdown"
          >
            <option value="">-- Turnier wählen --</option>
            {activeTournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!activeTournament ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
          <Trophy className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-semibold text-slate-700">Kein aktives Turnier ausgewählt</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Bitte wählen Sie oben ein aktives Turnier aus, um Spielstände zu erfassen. Turniere können im Tab "Turniere" aktiviert werden.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Matches/Participants Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filters for Team tournament */}
            {activeTournament.type === "team" && (
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex flex-wrap items-center gap-3 text-xs">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 text-indigo-600" />
                  Filter:
                </span>

                <select
                  value={filterPhase}
                  onChange={(e) => setFilterPhase(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 focus:outline-none"
                >
                  <option value="">Alle Phasen</option>
                  <option value="vorrunde">Vorrunde</option>
                  <option value="platzierung">Platzierungsspiele</option>
                </select>

                <select
                  value={filterRound}
                  onChange={(e) => setFilterRound(parseInt(e.target.value) || 0)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 focus:outline-none"
                >
                  <option value={0}>Alle Runden</option>
                  {roundsList.map((r) => (
                    <option key={r} value={r}>
                      Runde {r}
                    </option>
                  ))}
                </select>

                <select
                  value={filterCourt}
                  onChange={(e) => setFilterCourt(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 focus:outline-none"
                >
                  <option value="">Alle Bahnen</option>
                  {courtsList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {(filterRound !== 0 || filterCourt !== "" || filterPhase !== "") && (
                  <button
                    onClick={() => {
                      setFilterRound(0);
                      setFilterCourt("");
                      setFilterPhase("");
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>
            )}

            {/* TEAM MATCHES ENTERING */}
            {activeTournament.type === "team" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="live-matches-grid">
                {activeTournament.matches
                  .filter((m) => {
                    if (filterRound !== 0 && m.round !== filterRound) return false;
                    if (filterCourt !== "" && m.court !== filterCourt) return false;
                    if (filterPhase !== "" && m.phase !== filterPhase) return false;
                    return true;
                  })
                  .map((match) => {
                    const teamA = activeTournament.teams.find((t) => t.id === match.teamAId)?.name || "Unbekannt";
                    const teamB = activeTournament.teams.find((t) => t.id === match.teamBId)?.name || "Unbekannt";
                    const isCompleted = match.status === "completed";
                    const isActive = match.status === "active";

                    return (
                      <motion.div
                        key={match.id}
                        whileHover={{ y: -1 }}
                        onClick={() => handleOpenMatchScore(match)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-xs relative ${
                          isActive
                            ? "border-rose-300 bg-rose-50/20 shadow-sm shadow-rose-100"
                            : isCompleted
                            ? "border-slate-100 bg-white"
                            : "border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-sm"
                        }`}
                        id={`match-entry-card-${match.id}`}
                      >
                        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-100 mb-2.5 gap-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
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
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                              {match.kehrenCount || 6}K
                            </span>
                            {match.durchgang && (
                              <span className="text-[9px] font-bold text-slate-600 bg-slate-200/50 px-1.5 py-0.5 rounded">
                                Dg. {match.durchgang}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">{match.court}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isActive
                                  ? "bg-rose-100 text-rose-700 animate-pulse"
                                  : isCompleted
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {match.isDQ ? "DISQUALIFIZIERT" : match.isAbsent ? "NICHT ANGETRETEN" : isActive ? "LIVE" : isCompleted ? "ERLEDIGT" : "OFFEN"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-base py-1">
                          <div className="space-y-1.5 flex-1 pr-4">
                            <div className="flex items-center justify-between">
                              <p className={`font-bold ${isCompleted && !match.isDQ && !match.isAbsent && (match.teamAScore || 0) > (match.teamBScore || 0) ? "text-slate-900" : "text-slate-700"} ${match.isDQ && match.dqTeamId === match.teamAId ? "line-through text-rose-500" : ""} ${match.isAbsent && match.absentTeamId === match.teamAId ? "line-through text-slate-400" : ""}`}>
                                {teamA}
                              </p>
                              {match.isDQ && match.dqTeamId === match.teamAId && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">DQ</span>
                              )}
                              {match.isAbsent && match.absentTeamId === match.teamAId && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">NA</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className={`font-bold ${isCompleted && !match.isDQ && !match.isAbsent && (match.teamBScore || 0) > (match.teamAScore || 0) ? "text-slate-900" : "text-slate-700"} ${match.isDQ && match.dqTeamId === match.teamBId ? "line-through text-rose-500" : ""} ${match.isAbsent && match.absentTeamId === match.teamBId ? "line-through text-slate-400" : ""}`}>
                                {teamB}
                              </p>
                              {match.isDQ && match.dqTeamId === match.teamBId && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">DQ</span>
                              )}
                              {match.isAbsent && match.absentTeamId === match.teamBId && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">NA</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 items-end justify-center font-mono font-bold text-lg">
                            <span className={isCompleted ? "text-indigo-600" : "text-slate-400"}>
                              {match.teamAScore !== null ? match.teamAScore : "-"}
                            </span>
                            <span className={isCompleted ? "text-indigo-600" : "text-slate-400"}>
                              {match.teamBScore !== null ? match.teamBScore : "-"}
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-4 bottom-2.5 opacity-0 hover:opacity-100 transition-opacity">
                          <Edit2 className="h-3 w-3 text-indigo-500" />
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}

            {/* SINGLE PARTICIPANT COMPETITIONS (TARGET, DISTANCE, SPECIAL OLYMPICS) */}
            {activeTournament.type !== "team" && (
              <div className="space-y-2" id="live-target-list">
                {activeTournament.targetParticipants.map((p, idx) => {
                  let badgeColor = "bg-blue-50 text-blue-700";
                  let typeLabel = "Zielbewerb";

                  if (activeTournament.type === "distance") {
                    badgeColor = "bg-amber-50 text-amber-700";
                    typeLabel = "Weitenbewerb";
                  } else if (activeTournament.type === "special-olympics") {
                    badgeColor = "bg-purple-50 text-purple-700";
                    typeLabel = "Special Olympics";
                  }

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleOpenParticipantScore(p)}
                      className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                      id={`target-entry-card-${p.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${badgeColor}`}>
                            {typeLabel}
                          </span>
                          {p.specialOlympicsLevel && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                              {p.specialOlympicsLevel}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {idx + 1}. {p.playerName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">{p.clubName}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Display summary of attempts or passes */}
                        {activeTournament.type === "target" && (
                          <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs mr-2">
                            <div className="bg-slate-50 px-2.5 py-1 rounded">
                              <p className="text-[8px] text-slate-400 font-sans">D1</p>
                              <p className="font-bold text-slate-700">{p.scores?.round1 || 0}</p>
                            </div>
                            <div className="bg-slate-50 px-2.5 py-1 rounded">
                              <p className="text-[8px] text-slate-400 font-sans">D2</p>
                              <p className="font-bold text-slate-700">{p.scores?.round2 || 0}</p>
                            </div>
                            <div className="bg-slate-50 px-2.5 py-1 rounded">
                              <p className="text-[8px] text-slate-400 font-sans">D3</p>
                              <p className="font-bold text-slate-700">{p.scores?.round3 || 0}</p>
                            </div>
                            <div className="bg-slate-50 px-2.5 py-1 rounded">
                              <p className="text-[8px] text-slate-400 font-sans">D4</p>
                              <p className="font-bold text-slate-700">{p.scores?.round4 || 0}</p>
                            </div>
                          </div>
                        )}

                        {activeTournament.type === "distance" && p.distanceAttempts && p.distanceAttempts.length > 0 && (
                          <div className="flex gap-1 text-[9px] font-mono mr-2">
                            <span className="text-slate-400">Runden erfasst:</span>
                            <span className="font-bold text-amber-600 bg-amber-50 px-1 rounded">
                              {p.distanceAttempts.length}
                            </span>
                          </div>
                        )}

                        {activeTournament.type === "special-olympics" && p.specialOlympicsRounds && p.specialOlympicsRounds.length > 0 && (
                          <div className="flex gap-1 text-[9px] font-mono mr-2">
                            <span className="text-slate-400">Runden erfasst:</span>
                            <span className="font-bold text-purple-600 bg-purple-50 px-1 rounded">
                              {p.specialOlympicsRounds.length}
                            </span>
                          </div>
                        )}

                        <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-center min-w-[85px]">
                          <p className="text-[8px] text-indigo-200 uppercase font-bold tracking-wider">
                            {activeTournament.type === "distance" ? "Beste Weite" : "Gesamt"}
                          </p>
                          <p className="font-mono font-bold text-sm leading-tight">
                            {p.totalScore} {activeTournament.type === "distance" ? "m" : "Pkt."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeTournament.targetParticipants.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed rounded-xl">
                    Noch keine Teilnehmer erfasst. Fügen Sie diese im Tab "Turniere" hinzu.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats sidebar */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turnierstatus</h3>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Eingabe Aktiv</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Typ:</span>
                  <span className="font-bold text-slate-700 capitalize">
                    {activeTournament.type === "team" ? "Teambewerb" :
                     activeTournament.type === "target" ? "Zielbewerb" :
                     activeTournament.type === "distance" ? "Weitenbewerb" : "Special Olympics"}
                  </span>
                </div>
                {activeTournament.type === "team" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gesamtspiele:</span>
                      <span className="font-bold text-slate-700">{activeTournament.matches.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Erledigt:</span>
                      <span className="font-bold text-emerald-600">
                        {activeTournament.matches.filter((m) => m.status === "completed").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Verbleibend:</span>
                      <span className="font-bold text-indigo-600">
                        {activeTournament.matches.filter((m) => m.status !== "completed").length}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Teilnehmer:</span>
                    <span className="font-bold text-slate-700">{activeTournament.targetParticipants.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATCH TACTILE NUMPAD MODAL (WITH DQ / ABSENT CONTROLS) */}
      <AnimatePresence>
        {selectedMatch && activeTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" id="match-score-modal">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-sm rounded-2xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400">{selectedMatch.court}</span>
                  <h3 className="font-bold text-sm tracking-tight">Ergebniseingabe Runde {selectedMatch.round}</h3>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Special incident controls */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 space-y-3">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vorfälle / Ausnahmen</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDQ}
                      onChange={(e) => {
                        setIsDQ(e.target.checked);
                        if (e.target.checked) {
                          setDqTeamId(selectedMatch.teamAId);
                          setScoreA(0);
                          setScoreB(0);
                        }
                      }}
                      className="rounded text-indigo-500 border-slate-700 bg-slate-900"
                    />
                    <span>Disqualifikation (DQ)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAbsent}
                      onChange={(e) => {
                        setIsAbsent(e.target.checked);
                        if (e.target.checked) {
                          setAbsentTeamId(selectedMatch.teamAId);
                          setScoreA(0);
                          setScoreB(0);
                        }
                      }}
                      className="rounded text-indigo-500 border-slate-700 bg-slate-900"
                    />
                    <span>Nicht angetreten</span>
                  </label>
                </div>

                {isDQ && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase">DQ für Team:</label>
                    <select
                      value={dqTeamId}
                      onChange={(e) => setDqTeamId(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-rose-400"
                    >
                      <option value={selectedMatch.teamAId}>
                        {activeTournament.teams.find((t) => t.id === selectedMatch.teamAId)?.name || "Team A"}
                      </option>
                      <option value={selectedMatch.teamBId}>
                        {activeTournament.teams.find((t) => t.id === selectedMatch.teamBId)?.name || "Team B"}
                      </option>
                    </select>
                  </div>
                )}

                {isAbsent && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase">Nicht angetreten:</label>
                    <select
                      value={absentTeamId}
                      onChange={(e) => setAbsentTeamId(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-300"
                    >
                      <option value={selectedMatch.teamAId}>
                        {activeTournament.teams.find((t) => t.id === selectedMatch.teamAId)?.name || "Team A"}
                      </option>
                      <option value={selectedMatch.teamBId}>
                        {activeTournament.teams.find((t) => t.id === selectedMatch.teamBId)?.name || "Team B"}
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {/* Interactive tactile score counters */}
              <div className="grid grid-cols-2 gap-4 text-center">
                {/* Team A */}
                <div className={`space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800 ${isDQ && dqTeamId === selectedMatch.teamAId ? "opacity-50 border-rose-500/50" : ""} ${isAbsent && absentTeamId === selectedMatch.teamAId ? "opacity-50" : ""}`}>
                  <p className="text-xs font-bold text-slate-300 truncate">
                    {activeTournament.teams.find((t) => t.id === selectedMatch.teamAId)?.name || "Team A"}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      disabled={isDQ || isAbsent}
                      onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center font-bold text-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-mono font-bold text-3xl text-cyan-300 min-w-[40px]">{scoreA}</span>
                    <button
                      disabled={isDQ || isAbsent}
                      onClick={() => setScoreA(scoreA + 1)}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center font-bold text-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Quick selectors */}
                  <div className="grid grid-cols-3 gap-1 pt-2">
                    {[0, 3, 5, 7, 9, 11].map((val) => (
                      <button
                        key={val}
                        disabled={isDQ || isAbsent}
                        onClick={() => setScoreA(val)}
                        className={`py-1 rounded text-[10px] font-bold font-mono transition-colors disabled:opacity-30 ${
                          scoreA === val ? "bg-cyan-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team B */}
                <div className={`space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800 ${isDQ && dqTeamId === selectedMatch.teamBId ? "opacity-50 border-rose-500/50" : ""} ${isAbsent && absentTeamId === selectedMatch.teamBId ? "opacity-50" : ""}`}>
                  <p className="text-xs font-bold text-slate-300 truncate">
                    {activeTournament.teams.find((t) => t.id === selectedMatch.teamBId)?.name || "Team B"}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      disabled={isDQ || isAbsent}
                      onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center font-bold text-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-mono font-bold text-3xl text-cyan-300 min-w-[40px]">{scoreB}</span>
                    <button
                      disabled={isDQ || isAbsent}
                      onClick={() => setScoreB(scoreB + 1)}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center font-bold text-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Quick selectors */}
                  <div className="grid grid-cols-3 gap-1 pt-2">
                    {[0, 3, 5, 7, 9, 11].map((val) => (
                      <button
                        key={val}
                        disabled={isDQ || isAbsent}
                        onClick={() => setScoreB(val)}
                        className={`py-1 rounded text-[10px] font-bold font-mono transition-colors disabled:opacity-30 ${
                          scoreB === val ? "bg-cyan-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center justify-between bg-slate-800/30 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                <span className="text-slate-400">Spiel-Status:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMatchStatus("active")}
                    className={`px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider transition-colors ${
                      matchStatus === "active"
                        ? "bg-rose-500 text-white font-black"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                    }`}
                  >
                    Wird gespielt
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchStatus("completed")}
                    className={`px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider transition-colors ${
                      matchStatus === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                    }`}
                  >
                    Abgeschlossen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveMatchScore}
                  className="py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 shadow-md shadow-cyan-400/15"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RICH PARTICIPANT SCORE ENTRY MODAL (TARGET, DISTANCE & SPECIAL OLYMPICS WITH UP TO 16 ROUNDS) */}
      <AnimatePresence>
        {selectedParticipant && activeTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" id="participant-score-modal">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400">{selectedParticipant.clubName}</span>
                  <h3 className="font-bold text-sm tracking-tight">{selectedParticipant.playerName}</h3>
                </div>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* ACTIVE ROUND SELECTOR */}
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Aktive Runde wählen</label>
                  <p className="text-[9px] text-slate-500">Erfassen Sie Scores für Runde 1 bis 16.</p>
                </div>
                <select
                  value={activeRoundNumber}
                  onChange={(e) => loadParticipantRoundData(selectedParticipant, parseInt(e.target.value) || 1)}
                  className="bg-slate-950 border border-slate-800 text-cyan-400 rounded-lg px-3 py-1.5 font-bold focus:outline-none"
                >
                  {new Array(16).fill(null).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Runde {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* TARGET TOURNAMENT SCORE ENTRY */}
              {activeTournament.type === "target" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    Gegenüberstellung der 4 Durchgänge für Runde {activeRoundNumber} (max. 50 Punkte je Durchgang).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">D1 Ringe</p>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={round1}
                        onChange={(e) => setRound1(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full text-center font-mono font-bold text-lg bg-slate-950 rounded border border-slate-850 py-1 text-cyan-300 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">D2 Stöcke</p>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={round2}
                        onChange={(e) => setRound2(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full text-center font-mono font-bold text-lg bg-slate-950 rounded border border-slate-850 py-1 text-cyan-300 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">D3 Kreis-D</p>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={round3}
                        onChange={(e) => setRound3(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full text-center font-mono font-bold text-lg bg-slate-950 rounded border border-slate-850 py-1 text-cyan-300 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl space-y-1 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">D4 Kombi</p>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={round4}
                        onChange={(e) => setRound4(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full text-center font-mono font-bold text-lg bg-slate-950 rounded border border-slate-850 py-1 text-cyan-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg text-center text-xs text-slate-300">
                    Runde {activeRoundNumber} Summe: <span className="font-bold font-mono text-cyan-400">{round1 + round2 + round3 + round4} Pkt.</span>
                  </div>
                </div>
              )}

              {/* DISTANCE TOURNAMENT SCORE ENTRY */}
              {activeTournament.type === "distance" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    Tragen Sie bis zu 5 Versuche für Runde {activeRoundNumber} in Metern ein. Ungültige Versuche können mit der Checkbox markiert werden.
                  </p>

                  <div className="space-y-2">
                    {distanceAttempts.map((da, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-800/30 p-2 rounded-lg border border-slate-850">
                        <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase">Versuch {index + 1}</span>
                        <div className="col-span-6">
                          <input
                            type="text"
                            placeholder="z.B. 45.20"
                            value={da.distance}
                            disabled={!da.isValid}
                            onChange={(e) => {
                              const updated = [...distanceAttempts];
                              updated[index].distance = e.target.value;
                              setDistanceAttempts(updated);
                            }}
                            className="w-full text-center font-mono text-xs bg-slate-950 rounded border border-slate-800 py-1 text-amber-300 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-4 flex items-center justify-end gap-1 text-[10px]">
                          <input
                            type="checkbox"
                            checked={da.isValid}
                            onChange={(e) => {
                              const updated = [...distanceAttempts];
                              updated[index].isValid = e.target.checked;
                              if (!e.target.checked) updated[index].distance = "";
                              setDistanceAttempts(updated);
                            }}
                            className="rounded text-amber-500 border-slate-700 bg-slate-900"
                          />
                          <span className="text-slate-300">Gültig</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg text-center text-xs text-slate-300">
                    Runde {activeRoundNumber} Bestwert: <span className="font-bold font-mono text-amber-400">
                      {Math.max(0, ...distanceAttempts.map(da => da.isValid && da.distance !== "" ? parseFloat(da.distance) || 0 : 0))} m
                    </span>
                  </div>
                </div>
              )}

              {/* SPECIAL OLYMPICS SCORE ENTRY */}
              {activeTournament.type === "special-olympics" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    Tragen Sie die Punktwerte für die 8 Durchgänge in Runde {activeRoundNumber} ein.
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {specialOlympicsScores.map((score, index) => (
                      <div key={index} className="p-2 bg-slate-800/30 border border-slate-800 rounded-lg text-center space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold block">D{index + 1}</span>
                        <input
                          type="number"
                          min={0}
                          value={score}
                          onChange={(e) => {
                            const updated = [...specialOlympicsScores];
                            updated[index] = Math.max(0, parseInt(e.target.value) || 0);
                            setSpecialOlympicsScores(updated);
                          }}
                          className="w-full text-center font-mono text-xs font-bold bg-slate-950 rounded border border-slate-800 py-1 text-purple-300 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg text-center text-xs text-slate-300">
                    Runde {activeRoundNumber} Summe: <span className="font-bold font-mono text-purple-400">
                      {specialOlympicsScores.reduce((sum, s) => sum + s, 0)} Pkt.
                    </span>
                  </div>
                </div>
              )}

              {/* OVERALL RESULTS CALCULATION PANEL */}
              <div className="bg-slate-800 border border-slate-700/50 p-3.5 rounded-xl space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Berechnetes Gesamtergebnis (alle Runden)</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-xs text-slate-300">
                    {activeTournament.type === "distance" ? "Beste Weite über alle Runden:" : "Gesamtsumme aller Runden:"}
                  </span>
                  <span className="font-mono font-extrabold text-xl text-cyan-400">
                    {activeTournament.type === "target" ? (
                      // Live sum of target rounds
                      (() => {
                        const otherRounds = selectedParticipant.rounds?.filter(r => r.roundIndex !== activeRoundNumber) || [];
                        const currentRoundSum = round1 + round2 + round3 + round4;
                        const sumOther = otherRounds.reduce((sum, r) => sum + r.total, 0);
                        return `${sumOther + currentRoundSum} Pkt.`;
                      })()
                    ) : activeTournament.type === "distance" ? (
                      // Live max of distance rounds
                      (() => {
                        const otherRounds = selectedParticipant.distanceAttempts?.filter(r => r.roundIndex !== activeRoundNumber) || [];
                        let maxDist = 0;
                        otherRounds.forEach(r => {
                          if (r.best > maxDist) maxDist = r.best;
                        });
                        const currentAttempts = distanceAttempts.map(da => da.isValid && da.distance !== "" ? parseFloat(da.distance) || 0 : 0);
                        const currentMax = currentAttempts.length > 0 ? Math.max(...currentAttempts) : 0;
                        return `${Math.max(maxDist, currentMax)} m`;
                      })()
                    ) : (
                      // Live sum of special olympics rounds
                      (() => {
                        const otherRounds = selectedParticipant.specialOlympicsRounds?.filter(r => r.roundIndex !== activeRoundNumber) || [];
                        const currentRoundSum = specialOlympicsScores.reduce((sum, s) => sum + s, 0);
                        const sumOther = otherRounds.reduce((sum, r) => sum + r.total, 0);
                        return `${sumOther + currentRoundSum} Pkt.`;
                      })()
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  className="py-2 rounded-xl bg-slate-850 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveParticipantScore}
                  className="py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
