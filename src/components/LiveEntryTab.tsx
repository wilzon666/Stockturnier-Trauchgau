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
} from "lucide-react";
import { Tournament, Match, TargetParticipant } from "../types";

interface LiveEntryTabProps {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  onSelectTournament: (id: string) => void;
  onEnterMatchScore: (
    tourneyId: string,
    matchId: string,
    scoreA: number,
    scoreB: number,
    status: "active" | "completed"
  ) => void;
  onEnterTargetScore: (
    tourneyId: string,
    participantId: string,
    scores: { round1?: number; round2?: number; round3?: number; round4?: number }
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

  // Score temp state for Target entry
  const [targetRound1, setTargetRound1] = useState<number>(0);
  const [targetRound2, setTargetRound2] = useState<number>(0);
  const [targetRound3, setTargetRound3] = useState<number>(0);
  const [targetRound4, setTargetRound4] = useState<number>(0);

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
  };

  const handleSaveMatchScore = () => {
    if (!activeTournament || !selectedMatch) return;
    onEnterMatchScore(
      activeTournament.id,
      selectedMatch.id,
      scoreA,
      scoreB,
      matchStatus
    );
    setSelectedMatch(null);
  };

  const handleOpenParticipantScore = (p: TargetParticipant) => {
    setSelectedParticipant(p);
    setTargetRound1(p.scores.round1 || 0);
    setTargetRound2(p.scores.round2 || 0);
    setTargetRound3(p.scores.round3 || 0);
    setTargetRound4(p.scores.round4 || 0);
  };

  const handleSaveParticipantScore = () => {
    if (!activeTournament || !selectedParticipant) return;
    onEnterTargetScore(activeTournament.id, selectedParticipant.id, {
      round1: targetRound1,
      round2: targetRound2,
      round3: targetRound3,
      round4: targetRound4,
    });
    setSelectedParticipant(null);
  };

  // Helper lists for filtering
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
            Erfassen Sie die Ergebnisse live auf dem Platz. Diese werden in Echtzeit auf StockTV übertragen.
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
                              {isActive ? "LIVE" : isCompleted ? "ERLEDIGT" : "OFFEN"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-base py-1">
                          <div className="space-y-1.5 flex-1 pr-4">
                            <p className={`font-bold ${isCompleted && (match.teamAScore || 0) > (match.teamBScore || 0) ? "text-slate-900" : "text-slate-700"}`}>
                              {teamA}
                            </p>
                            <p className={`font-bold ${isCompleted && (match.teamBScore || 0) > (match.teamAScore || 0) ? "text-slate-900" : "text-slate-700"}`}>
                              {teamB}
                            </p>
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

            {/* TARGET COMPETITION ENTERING */}
            {activeTournament.type === "target" && (
              <div className="space-y-2" id="live-target-list">
                {activeTournament.targetParticipants.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => handleOpenParticipantScore(p)}
                    className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    id={`target-entry-card-${p.id}`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {idx + 1}. {p.playerName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">{p.clubName}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs">
                        <div className="bg-slate-50 px-2.5 py-1.5 rounded">
                          <p className="text-[9px] text-slate-400 font-sans">D1</p>
                          <p className="font-bold text-slate-700">{p.scores.round1 || 0}</p>
                        </div>
                        <div className="bg-slate-50 px-2.5 py-1.5 rounded">
                          <p className="text-[9px] text-slate-400 font-sans">D2</p>
                          <p className="font-bold text-slate-700">{p.scores.round2 || 0}</p>
                        </div>
                        <div className="bg-slate-50 px-2.5 py-1.5 rounded">
                          <p className="text-[9px] text-slate-400 font-sans">D3</p>
                          <p className="font-bold text-slate-700">{p.scores.round3 || 0}</p>
                        </div>
                        <div className="bg-slate-50 px-2.5 py-1.5 rounded">
                          <p className="text-[9px] text-slate-400 font-sans">D4</p>
                          <p className="font-bold text-slate-700">{p.scores.round4 || 0}</p>
                        </div>
                      </div>

                      <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-center min-w-[70px]">
                        <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-wider">Gesamt</p>
                        <p className="font-mono font-bold text-sm leading-tight">{p.totalScore}</p>
                      </div>
                    </div>
                  </div>
                ))}

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
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Live am Server</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Typ:</span>
                  <span className="font-bold text-slate-700">
                    {activeTournament.type === "team" ? "Mannschaft" : "Zielschiessen"}
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

      {/* MATCH TACTILE NUMPAD MODAL */}
      <AnimatePresence>
        {selectedMatch && activeTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" id="match-score-modal">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-sm rounded-2xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 flex flex-col gap-5"
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

              {/* Interactive tactile score counters */}
              <div className="grid grid-cols-2 gap-4 text-center">
                {/* Team A */}
                <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <p className="text-xs font-bold text-slate-300 truncate">
                    {activeTournament.teams.find((t) => t.id === selectedMatch.teamAId)?.name || "Team A"}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center font-bold text-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-mono font-bold text-3xl text-cyan-300 min-w-[40px]">{scoreA}</span>
                    <button
                      onClick={() => setScoreA(scoreA + 1)}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center font-bold text-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Quick selectors */}
                  <div className="grid grid-cols-3 gap-1 pt-2">
                    {[0, 3, 5, 9, 12, 15].map((val) => (
                      <button
                        key={val}
                        onClick={() => setScoreA(val)}
                        className={`py-1 rounded text-[10px] font-bold font-mono transition-colors ${
                          scoreA === val ? "bg-cyan-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team B */}
                <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <p className="text-xs font-bold text-slate-300 truncate">
                    {activeTournament.teams.find((t) => t.id === selectedMatch.teamBId)?.name || "Team B"}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center font-bold text-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-mono font-bold text-3xl text-cyan-300 min-w-[40px]">{scoreB}</span>
                    <button
                      onClick={() => setScoreB(scoreB + 1)}
                      className="h-9 w-9 rounded-full bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center font-bold text-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Quick selectors */}
                  <div className="grid grid-cols-3 gap-1 pt-2">
                    {[0, 3, 5, 9, 12, 15].map((val) => (
                      <button
                        key={val}
                        onClick={() => setScoreB(val)}
                        className={`py-1 rounded text-[10px] font-bold font-mono transition-colors ${
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

      {/* TARGET PARTICIPANT SCORE ENTRY MODAL */}
      <AnimatePresence>
        {selectedParticipant && activeTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" id="participant-score-modal">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 text-white p-6 shadow-2xl border border-slate-800 flex flex-col gap-4"
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

              <p className="text-[10px] text-slate-400">
                Geben Sie für jeden der 4 Durchgänge die Punkte ein (jeweils max. 50 Punkte).
              </p>

              {/* Form grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Round 1 */}
                <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-300">Durchgang 1 (Ringe)</p>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={targetRound1}
                    onChange={(e) => setTargetRound1(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-mono font-bold text-xl bg-slate-900 rounded border border-slate-800 py-1 text-cyan-300 focus:outline-none"
                  />
                </div>

                {/* Round 2 */}
                <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-300">Durchgang 2 (Stöcke)</p>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={targetRound2}
                    onChange={(e) => setTargetRound2(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-mono font-bold text-xl bg-slate-900 rounded border border-slate-800 py-1 text-cyan-300 focus:outline-none"
                  />
                </div>

                {/* Round 3 */}
                <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-300">Durchgang 3 (Kreis-Diag)</p>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={targetRound3}
                    onChange={(e) => setTargetRound3(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-mono font-bold text-xl bg-slate-900 rounded border border-slate-800 py-1 text-cyan-300 focus:outline-none"
                  />
                </div>

                {/* Round 4 */}
                <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1 text-center">
                  <p className="text-[10px] font-bold text-slate-300">Durchgang 4 (Kombi)</p>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={targetRound4}
                    onChange={(e) => setTargetRound4(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full text-center font-mono font-bold text-xl bg-slate-900 rounded border border-slate-800 py-1 text-cyan-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Computed Live Total */}
              <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Summe Gesamt:</span>
                <span className="font-mono font-extrabold text-2xl text-cyan-400">
                  {targetRound1 + targetRound2 + targetRound3 + targetRound4} / 200
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  className="py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
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
