import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Clock,
  Play,
  Pause,
  Tv,
  LayoutDashboard,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Volume2,
} from "lucide-react";
import { Tournament, Team, Match, TargetParticipant, TeamRankingRow } from "../types";
import { StockAPI, computeTeamRankings, computeSpecialTournamentRankings } from "../lib/api";

interface ScoreboardProps {
  onBackToAdmin?: () => void;
}

export default function Scoreboard({ onBackToAdmin }: ScoreboardProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Auto-rotation states
  const [activeSlideIndex, setActiveSlideIndex] = useState(0); // 0 = Tabelle, 1+ = Bahnen
  const [isAutoRotating, setIsAutoRotating] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const rotate = params.get("rotate");
    if (rotate === "false" || rotate === "0") {
      return false;
    }
    return true;
  });
  const [rotationProgress, setRotationProgress] = useState(0);

  const ROTATION_DURATION_MS = 10000; // 10 seconds per slide

  // Load latest tournament data
  const fetchData = async () => {
    try {
      const list = await StockAPI.getTournaments();
      setTournaments(list);
    } catch (e) {
      console.error("Error loading scoreboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Sync current path periodically
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    const pathInterval = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    }, 500);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(pathInterval);
    };
  }, [currentPath]);

  // Initial load and live syncing (every 4 seconds)
  useEffect(() => {
    fetchData();
    const syncInterval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(syncInterval);
  }, []);

  // Update clock time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Find live or active tournament
  const activeTournament =
    tournaments.find((t) => t.status === "active" && !t.archived) ||
    tournaments.find((t) => !t.archived) ||
    tournaments[0] ||
    null;

  // Extract courts and build dynamic slides
  const courtsList =
    activeTournament && activeTournament.type === "team"
      ? (Array.from(new Set(activeTournament.matches.map((m) => m.court))).sort() as string[])
      : [];

  const totalSlides = 1 + courtsList.length; // 1 (Standings Table) + N (Courts)

  // Handle URL lane targeting: e.g. /scoreboardbahn_1
  const isSpecificLanePage = currentPath.includes("/scoreboardbahn_");
  let targetedCourtName: string | null = null;
  if (isSpecificLanePage && activeTournament && activeTournament.type === "team") {
    const matchMatch = currentPath.match(/\/scoreboardbahn_(\d+)/);
    if (matchMatch) {
      const laneNum = parseInt(matchMatch[1]);
      if (!isNaN(laneNum)) {
        // Option 1: Map laneNum directly as index (e.g., 1 -> courtsList[0])
        if (courtsList[laneNum - 1]) {
          targetedCourtName = courtsList[laneNum - 1];
        } else {
          // Option 2: Fallback to name match (e.g. looks for a court with "1" in its name)
          const found = courtsList.find(
            (c) =>
              c.includes(laneNum.toString()) ||
              c.toLowerCase().includes(String.fromCharCode(64 + laneNum).toLowerCase()) // e.g. 1 -> A, 2 -> B
          );
          if (found) {
            targetedCourtName = found;
          }
        }
      }
    }
  }

  // Handle auto-rotation logic for general scoreboard page
  useEffect(() => {
    if (!isAutoRotating || isSpecificLanePage || totalSlides <= 1) {
      setRotationProgress(0);
      return;
    }

    const timerStep = 100; // Update progress every 100ms
    const totalSteps = ROTATION_DURATION_MS / timerStep;
    let currentStep = 0;

    const rotationInterval = setInterval(() => {
      currentStep++;
      setRotationProgress((currentStep / totalSteps) * 100);

      if (currentStep >= totalSteps) {
        currentStep = 0;
        setActiveSlideIndex((prevIndex) => (prevIndex + 1) % totalSlides);
      }
    }, timerStep);

    return () => clearInterval(rotationInterval);
  }, [isAutoRotating, totalSlides, isSpecificLanePage, activeSlideIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="h-10 w-10 animate-spin text-cyan-400 mb-4" />
        <h2 className="text-lg font-black tracking-widest text-white uppercase">Lade Live-Scoreboard...</h2>
        <p className="text-xs text-slate-500 mt-1">Verbindung zum Turnier-Server wird hergestellt</p>
      </div>
    );
  }

  if (!activeTournament) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-rose-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black tracking-widest text-white uppercase">Kein Turnier verfügbar</h2>
        <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
          Aktuell sind keine Turniere im System angelegt. Bitte legen Sie im Admin-Bereich ein Turnier an und starten Sie dieses.
        </p>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Zurück zur Administration
          </button>
        )}
      </div>
    );
  }

  // Calculate team rankings for sidebar or slides
  const rankings =
    activeTournament.type === "team"
      ? activeTournament.isSpecialThreeLaneMode
        ? computeSpecialTournamentRankings(activeTournament)
        : computeTeamRankings(activeTournament.teams, activeTournament.matches, activeTournament.rulesVersion)
      : [];

  // Group A and Group B for special 3-lane modes
  const groupATeams = activeTournament.teams.filter((t) => t.group === "Gruppe A" || !t.group);
  const groupBTeams = activeTournament.teams.filter((t) => t.group === "Gruppe B");
  const vorrundeMatches = activeTournament.matches.filter((m) => m.phase === "vorrunde" || !m.phase);
  const standingsGroupA = activeTournament.isSpecialThreeLaneMode
    ? computeTeamRankings(groupATeams, vorrundeMatches, activeTournament.rulesVersion)
    : [];
  const standingsGroupB = activeTournament.isSpecialThreeLaneMode
    ? computeTeamRankings(groupBTeams, vorrundeMatches, activeTournament.rulesVersion)
    : [];

  // Calculate target standings
  const targetParticipantsSorted = [...activeTournament.targetParticipants].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  // If viewing a specific lane page but lane court is not resolved, fallback
  const currentCourt = isSpecificLanePage ? targetedCourtName || courtsList[0] : courtsList[activeSlideIndex - 1];

  const handleManualSlideSelect = (idx: number) => {
    setIsAutoRotating(false);
    setActiveSlideIndex(idx);
  };

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col font-sans relative overflow-hidden select-none select-none">
      {/* Glow Effects in Background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* SCOREBOARD HEADER */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Trophy className="h-5.5 w-5.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold text-indigo-400 tracking-wider uppercase font-mono">
                {activeTournament.association || "TSV Trauchgau e.V. - Abteilung Eisstock"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full leading-none">
                LIVE-SCORE
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white uppercase truncate">
              {activeTournament.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          {/* Metadata */}
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wettbewerb & Ort</p>
            <p className="text-xs font-bold text-slate-300">
              {activeTournament.location} • {new Date(activeTournament.date).toLocaleDateString("de-DE")}
            </p>
          </div>

          {/* Clock */}
          <div className="bg-slate-900 border border-slate-800/80 px-4 py-1.5 rounded-xl text-center shadow-inner shrink-0">
            <div className="flex items-center gap-1.5 justify-center">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono text-sm font-black tracking-wider text-cyan-300">{currentTime}</span>
            </div>
            <p className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Uhrzeit</p>
          </div>

          {/* Back button */}
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Admin
            </button>
          )}
        </div>
      </header>

      {/* ROTATION PROGRESS BAR (only for general scoreboard) */}
      {!isSpecificLanePage && totalSlides > 1 && isAutoRotating && (
        <div className="w-full h-1 bg-slate-950 relative z-20">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 transition-all duration-100 ease-linear"
            style={{ width: `${rotationProgress}%` }}
          ></div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative z-10 p-4 md:p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* 1. STANDINGS OVERVIEW SLIDE */}
          {(isSpecificLanePage ? false : activeSlideIndex === 0) ? (
            <motion.div
              key="standings-slide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-white">
                    Gesamttabelle • Aktueller Stand
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-900">
                  {rankings.length || targetParticipantsSorted.length} Teilnehmer
                </span>
              </div>

              {/* TEAM TOURNAMENT LEADERBOARD */}
              {activeTournament.type === "team" && (
                <>
                  {activeTournament.isSpecialThreeLaneMode ? (
                    /* 3-lane Group Standings Side-by-Side */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                      {/* Group A */}
                      <div className="bg-slate-950/40 rounded-2xl border border-slate-900 p-4 flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                          <h3 className="font-extrabold text-indigo-300 text-xs uppercase tracking-wider">
                            Vorrunde Gruppe A
                          </h3>
                          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">
                            4 Kehren pro Spiel
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 font-bold text-[10px] uppercase font-mono">
                                <th className="py-2.5 text-center w-12">Rang</th>
                                <th className="py-2.5">Mannschaft</th>
                                <th className="py-2.5 text-center w-12">Sp.</th>
                                <th className="py-2.5 text-center w-20">Punkte</th>
                                <th className="py-2.5 text-center w-20">Stöcke</th>
                                <th className="py-2.5 text-center w-16">Diff.</th>
                                <th className="py-2.5 text-center w-18 text-cyan-400">Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 font-medium">
                              {standingsGroupA.map((row, idx) => (
                                <tr
                                  key={row.teamId}
                                  className="hover:bg-slate-900/20 transition-all text-slate-300 border-b border-slate-900/20"
                                >
                                  <td className="py-2.5 text-center">
                                    <span
                                      className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-black ${
                                        idx === 0
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                          : idx === 1
                                          ? "bg-slate-300/20 text-slate-200 border border-slate-300/30"
                                          : idx === 2
                                          ? "bg-amber-700/20 text-amber-500 border border-amber-700/30"
                                          : "bg-slate-900 text-slate-400"
                                      }`}
                                    >
                                      {idx + 1}
                                    </span>
                                  </td>
                                  <td className="py-2.5 font-bold text-white max-w-[140px] truncate">
                                    {row.teamName}
                                  </td>
                                  <td className="py-2.5 text-center text-slate-400">{row.matchesPlayed}</td>
                                  <td className="py-2.5 text-center font-mono font-extrabold text-indigo-300">
                                    {row.matchPointsPositive}:{row.matchPointsNegative}
                                  </td>
                                  <td className="py-2.5 text-center font-mono text-slate-400">
                                    {row.stockPointsPositive}:{row.stockPointsNegative}
                                  </td>
                                  <td
                                    className={`py-2.5 text-center font-mono ${
                                      row.stockPointsDiff > 0
                                        ? "text-emerald-400 font-bold"
                                        : row.stockPointsDiff < 0
                                        ? "text-rose-400"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {row.stockPointsDiff > 0 ? `+${row.stockPointsDiff}` : row.stockPointsDiff}
                                  </td>
                                  <td className="py-2.5 text-center font-mono font-black text-cyan-400">
                                    {row.stockNote.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Group B */}
                      <div className="bg-slate-950/40 rounded-2xl border border-slate-900 p-4 flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                          <h3 className="font-extrabold text-indigo-300 text-xs uppercase tracking-wider">
                            Vorrunde Gruppe B
                          </h3>
                          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">
                            4 Kehren pro Spiel
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-900 text-slate-500 font-bold text-[10px] uppercase font-mono">
                                <th className="py-2.5 text-center w-12">Rang</th>
                                <th className="py-2.5">Mannschaft</th>
                                <th className="py-2.5 text-center w-12">Sp.</th>
                                <th className="py-2.5 text-center w-20">Punkte</th>
                                <th className="py-2.5 text-center w-20">Stöcke</th>
                                <th className="py-2.5 text-center w-16">Diff.</th>
                                <th className="py-2.5 text-center w-18 text-cyan-400">Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60 font-medium">
                              {standingsGroupB.map((row, idx) => (
                                <tr
                                  key={row.teamId}
                                  className="hover:bg-slate-900/20 transition-all text-slate-300 border-b border-slate-900/20"
                                >
                                  <td className="py-2.5 text-center">
                                    <span
                                      className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-black ${
                                        idx === 0
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                          : idx === 1
                                          ? "bg-slate-300/20 text-slate-200 border border-slate-300/30"
                                          : idx === 2
                                          ? "bg-amber-700/20 text-amber-500 border border-amber-700/30"
                                          : "bg-slate-900 text-slate-400"
                                      }`}
                                    >
                                      {idx + 1}
                                    </span>
                                  </td>
                                  <td className="py-2.5 font-bold text-white max-w-[140px] truncate">
                                    {row.teamName}
                                  </td>
                                  <td className="py-2.5 text-center text-slate-400">{row.matchesPlayed}</td>
                                  <td className="py-2.5 text-center font-mono font-extrabold text-indigo-300">
                                    {row.matchPointsPositive}:{row.matchPointsNegative}
                                  </td>
                                  <td className="py-2.5 text-center font-mono text-slate-400">
                                    {row.stockPointsPositive}:{row.stockPointsNegative}
                                  </td>
                                  <td
                                    className={`py-2.5 text-center font-mono ${
                                      row.stockPointsDiff > 0
                                        ? "text-emerald-400 font-bold"
                                        : row.stockPointsDiff < 0
                                        ? "text-rose-400"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {row.stockPointsDiff > 0 ? `+${row.stockPointsDiff}` : row.stockPointsDiff}
                                  </td>
                                  <td className="py-2.5 text-center font-mono font-black text-cyan-400">
                                    {row.stockNote.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard Single Leaderboard Table */
                    <div className="bg-slate-950/40 rounded-2xl border border-slate-900 p-5 flex-1 shadow-2xl overflow-hidden">
                      <div className="overflow-x-auto h-full">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 font-bold text-[11px] uppercase tracking-wider font-mono">
                              <th className="py-3 text-center w-14">Rang</th>
                              <th className="py-3 pl-2">Verein / Mannschaft</th>
                              <th className="py-3 text-center w-20">Spiele</th>
                              <th className="py-3 text-center w-28">Punkte</th>
                              <th className="py-3 text-center w-28">Stockpunkte</th>
                              <th className="py-3 text-center w-24">Diff.</th>
                              <th className="py-3 text-center w-24 text-cyan-400 font-black">Stocknote</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 font-medium">
                            {rankings.map((row, idx) => (
                              <tr
                                key={row.teamId}
                                className="hover:bg-slate-900/30 transition-all text-slate-300 border-b border-slate-900/20"
                              >
                                <td className="py-3.5 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center h-6.5 w-6.5 rounded-lg text-xs font-black ${
                                      idx === 0
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/5"
                                        : idx === 1
                                        ? "bg-slate-300/20 text-slate-200 border border-slate-300/30 shadow-md"
                                        : idx === 2
                                        ? "bg-amber-700/20 text-amber-500 border border-amber-700/30 shadow-md"
                                        : "bg-slate-900 text-slate-400"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="py-3.5 pl-2">
                                  <div className="font-bold text-white text-sm md:text-base">{row.teamName}</div>
                                  {row.club && <span className="text-[10px] text-slate-500 font-bold">{row.club}</span>}
                                </td>
                                <td className="py-3.5 text-center text-slate-400 font-bold">{row.matchesPlayed}</td>
                                <td className="py-3.5 text-center font-mono font-black text-indigo-300 text-sm md:text-base">
                                  {row.matchPointsPositive}:{row.matchPointsNegative}
                                </td>
                                <td className="py-3.5 text-center font-mono text-slate-400">
                                  {row.stockPointsPositive}:{row.stockPointsNegative}
                                </td>
                                <td
                                  className={`py-3.5 text-center font-mono font-bold ${
                                    row.stockPointsDiff > 0
                                      ? "text-emerald-400 text-sm"
                                      : row.stockPointsDiff < 0
                                      ? "text-rose-400 text-sm"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {row.stockPointsDiff > 0 ? `+${row.stockPointsDiff}` : row.stockPointsDiff}
                                </td>
                                <td className="py-3.5 text-center font-mono font-black text-cyan-400 text-sm md:text-base">
                                  {row.stockNote.toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TARGET/DISTANCE/SPECIAL OLYMPICS TOURNAMENT LEADERBOARD */}
              {activeTournament.type !== "team" && (
                <div className="bg-slate-950/40 rounded-2xl border border-slate-900 p-5 flex-1 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto h-full">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold text-[11px] uppercase tracking-wider font-mono">
                          <th className="py-3 text-center w-14">Rang</th>
                          <th className="py-3 pl-2">Spieler / Sportler</th>
                          <th className="py-3">Verein / Club</th>
                          {activeTournament.type === "target" && (
                            <>
                              <th className="py-3 text-center w-16">D1</th>
                              <th className="py-3 text-center w-16">D2</th>
                              <th className="py-3 text-center w-16">D3</th>
                              <th className="py-3 text-center w-16">D4</th>
                            </>
                          )}
                          <th className="py-3 text-center w-36 text-cyan-400 font-black">Ergebnis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 font-medium">
                        {targetParticipantsSorted.map((p, idx) => {
                          // Find latest target score details
                          const latestRound = p.rounds && p.rounds.length > 0 ? p.rounds[p.rounds.length - 1] : null;
                          return (
                            <tr
                              key={p.id}
                              className="hover:bg-slate-900/30 transition-all text-slate-300 border-b border-slate-900/20"
                            >
                              <td className="py-3.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center h-6.5 w-6.5 rounded-lg text-xs font-black ${
                                    idx === 0
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/5"
                                      : idx === 1
                                      ? "bg-slate-300/20 text-slate-200 border border-slate-300/30 shadow-md"
                                      : idx === 2
                                      ? "bg-amber-700/20 text-amber-500 border border-amber-700/30 shadow-md"
                                      : "bg-slate-900 text-slate-400"
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-3.5 pl-2">
                                <div className="font-bold text-white text-sm md:text-base">{p.playerName}</div>
                              </td>
                              <td className="py-3.5 text-slate-400 font-bold text-xs md:text-sm">{p.clubName || "—"}</td>
                              {activeTournament.type === "target" && (
                                <>
                                  <td className="py-3.5 text-center text-slate-400 font-mono">
                                    {latestRound?.pass1 ?? p.scores.round1 ?? 0}
                                  </td>
                                  <td className="py-3.5 text-center text-slate-400 font-mono">
                                    {latestRound?.pass2 ?? p.scores.round2 ?? 0}
                                  </td>
                                  <td className="py-3.5 text-center text-slate-400 font-mono">
                                    {latestRound?.pass3 ?? p.scores.round3 ?? 0}
                                  </td>
                                  <td className="py-3.5 text-center text-slate-400 font-mono">
                                    {latestRound?.pass4 ?? p.scores.round4 ?? 0}
                                  </td>
                                </>
                              )}
                              <td className="py-3.5 text-center font-mono font-black text-cyan-400 text-base md:text-lg">
                                {p.totalScore}{" "}
                                <span className="text-[10px] text-slate-500 font-bold uppercase font-sans">
                                  {activeTournament.type === "distance" ? "m" : "Pkt."}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* 2. SPECIFIC COURT/LANE VIEW SLIDE (Rotating or Specific URL targeted) */
            <motion.div
              key={`court-slide-${currentCourt}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="h-full flex flex-col space-y-4"
            >
              {/* Lane Title & Status Bar */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center justify-center h-8 px-4 bg-indigo-600 font-black text-sm tracking-wider uppercase rounded-xl border border-indigo-500/20 text-white shadow-md shadow-indigo-600/10">
                    {currentCourt || "SPIELFELD"}
                  </span>
                  <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                    Aktuelle Paarungen und Ergebnisse
                  </span>
                </div>

                {isSpecificLanePage && (
                  <span className="inline-flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full leading-none animate-pulse">
                    DIESES SPIELFELD LOKALISIERT
                  </span>
                )}
              </div>

              {(() => {
                // Find games specifically for this court
                const courtMatches = activeTournament.matches.filter((m) => m.court === currentCourt);

                // Live match on this lane
                const activeMatch = courtMatches.find((m) => m.status === "active");

                // Planned/upcoming matches on this lane
                const upcomingMatches = courtMatches.filter((m) => m.status === "planned").slice(0, 3);

                // Completed matches on this lane
                const completedMatches = courtMatches.filter((m) => m.status === "completed").slice(0, 3);

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                    {/* LEFT & CENTER PANEL (Active Match and List) */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col h-full justify-between">
                      {/* Live Match Card */}
                      <div className="bg-slate-950/40 rounded-3xl border border-slate-900 p-6 flex flex-col justify-between flex-1 relative overflow-hidden shadow-2xl">
                        {/* Status indicators */}
                        <div className="flex items-center justify-between border-b border-slate-900/50 pb-3 mb-4">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 font-mono">
                            {activeMatch ? `Durchgang ${activeMatch.durchgang || "—"} / Runde ${activeMatch.round}` : "Aktueller Status"}
                          </span>
                          {activeMatch ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                              Laufendes Spiel
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-bold uppercase">
                              Kein aktives Spiel
                            </span>
                          )}
                        </div>

                        {activeMatch ? (
                          <div className="flex-1 flex flex-col justify-center space-y-8 py-4">
                            {/* Scoreboard duel look */}
                            <div className="flex items-center justify-between gap-4">
                              {/* Team A */}
                              <div className="flex-1 text-center space-y-2">
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                  Mannschaft A
                                </div>
                                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight line-clamp-2 leading-tight">
                                  {
                                    activeTournament.teams.find((t) => t.id === activeMatch.teamAId)?.name ||
                                    "Unbekannt"
                                  }
                                </h3>
                                <div className="text-[11px] font-bold text-slate-500">
                                  {activeTournament.teams.find((t) => t.id === activeMatch.teamAId)?.club}
                                </div>
                              </div>

                              {/* VS divider & Scores */}
                              <div className="flex items-center gap-4 px-2">
                                <div className="font-mono text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] min-w-[70px] text-center">
                                  {activeMatch.teamAScore !== null ? activeMatch.teamAScore : "—"}
                                </div>
                                <div className="text-slate-700 font-black text-lg font-mono">:</div>
                                <div className="font-mono text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] min-w-[70px] text-center">
                                  {activeMatch.teamBScore !== null ? activeMatch.teamBScore : "—"}
                                </div>
                              </div>

                              {/* Team B */}
                              <div className="flex-1 text-center space-y-2">
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                  Mannschaft B
                                </div>
                                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight line-clamp-2 leading-tight">
                                  {
                                    activeTournament.teams.find((t) => t.id === activeMatch.teamBId)?.name ||
                                    "Unbekannt"
                                  }
                                </h3>
                                <div className="text-[11px] font-bold text-slate-500">
                                  {activeTournament.teams.find((t) => t.id === activeMatch.teamBId)?.club}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                            <Tv className="h-14 w-14 text-slate-800" />
                            <h4 className="font-extrabold text-white uppercase text-sm tracking-widest">
                              Spielpause auf dieser Bahn
                            </h4>
                            <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                              Zurzeit wird auf dieser Bahn kein Spiel aktiv erfasst. In Kürze geht es mit den geplanten Paarungen weiter.
                            </p>
                          </div>
                        )}

                        {/* Extra footer metadata */}
                        <div className="border-t border-slate-900/50 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                          <span>Modus: {activeTournament.kehrenCount} Kehren</span>
                          <span>TSV TRAUCHGAU TOURNAMENT PLATFORM</span>
                        </div>
                      </div>

                      {/* Next / Upcoming matches */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                          Nächste Begegnungen auf {currentCourt}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {upcomingMatches.length > 0 ? (
                            upcomingMatches.map((match) => (
                              <div
                                key={match.id}
                                className="bg-slate-950/20 border border-slate-900 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-[9px] font-bold text-slate-500 uppercase font-mono">
                                    Runde {match.round} • Durchgang {match.durchgang || "—"}
                                  </div>
                                  <div className="font-extrabold text-white uppercase truncate mt-0.5">
                                    {activeTournament.teams.find((t) => t.id === match.teamAId)?.name || "Unbekannt"}
                                  </div>
                                  <div className="font-extrabold text-slate-400 uppercase truncate mt-0.5">
                                    {activeTournament.teams.find((t) => t.id === match.teamBId)?.name || "Unbekannt"}
                                  </div>
                                </div>
                                <span className="font-bold text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-900/20 px-2 py-1.5 rounded-lg shrink-0">
                                  Vorbereiten
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-center py-4 bg-slate-950/10 border border-dashed border-slate-900/60 rounded-xl text-xs text-slate-600">
                              Keine weiteren Spiele geplant.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL (Completed Matches & Standings snippet) */}
                    <div className="space-y-6 flex flex-col justify-between">
                      {/* Recent completed results */}
                      <div className="bg-slate-950/30 rounded-2xl border border-slate-900 p-4 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                          Letzte Ergebnisse auf {currentCourt}
                        </h4>
                        <div className="space-y-2">
                          {completedMatches.length > 0 ? (
                            completedMatches.map((match) => (
                              <div
                                key={match.id}
                                className="bg-slate-950/50 border border-slate-900/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs hover:border-slate-800 transition-colors"
                              >
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-bold font-mono text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded uppercase">
                                      R{match.round}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Beendet</span>
                                  </div>
                                  <div className="font-extrabold text-white truncate text-[11px] uppercase">
                                    {activeTournament.teams.find((t) => t.id === match.teamAId)?.name}
                                  </div>
                                  <div className="font-extrabold text-slate-300 truncate text-[11px] uppercase">
                                    {activeTournament.teams.find((t) => t.id === match.teamBId)?.name}
                                  </div>
                                </div>
                                <div className="bg-slate-900/80 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-center shrink-0 min-w-[50px]">
                                  <div className="font-mono font-black text-cyan-400 text-xs">
                                    {match.teamAScore}
                                  </div>
                                  <div className="h-px bg-slate-800 my-0.5"></div>
                                  <div className="font-mono font-black text-cyan-400 text-xs">
                                    {match.teamBScore}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 bg-slate-950/10 border border-dashed border-slate-900/40 rounded-xl text-xs text-slate-600">
                              Noch keine Spiele abgeschlossen.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Snippet of general table */}
                      <div className="bg-slate-950/30 rounded-2xl border border-slate-900 p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 pl-1 border-b border-slate-900 pb-1.5 mb-2.5 flex items-center justify-between">
                            <span>Gesamtwertung</span>
                            <span className="text-[8px] font-normal text-slate-500 uppercase font-sans">Auszug</span>
                          </h4>
                          <div className="space-y-1.5">
                            {rankings.slice(0, 5).map((row, idx) => (
                              <div
                                key={row.teamId}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-900/20 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-black text-[10px] text-indigo-400 w-4 text-center">
                                    {idx + 1}
                                  </span>
                                  <span className="font-extrabold text-white uppercase truncate text-[11px]">
                                    {row.teamName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                                  <span className="text-indigo-300 font-extrabold">
                                    {row.matchPointsPositive}:{row.matchPointsNegative}
                                  </span>
                                  <span className="text-slate-600">|</span>
                                  <span className="text-cyan-400 font-black">{row.stockNote.toFixed(3)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Slide Navigation hints */}
                        {!isSpecificLanePage && (
                          <div className="pt-2 text-[9px] text-slate-600 font-semibold text-center border-t border-slate-900/40 uppercase tracking-wider">
                            Wechselt in Kürze zur nächsten Ansicht
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* SCOREBOARD FOOTER CONTROLS & MANUAL ROTATOR (only for general scoreboard, hidden on lane scoreboard) */}
      {!isSpecificLanePage && (
        <footer className="relative z-10 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xl">
          {/* Cycle Info / Control buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                isAutoRotating
                  ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20"
                  : "bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold hover:bg-cyan-400"
              }`}
              title={isAutoRotating ? "Auto-Wechsel pausieren" : "Auto-Wechsel starten"}
            >
              {isAutoRotating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="text-xs">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 block">
                Präsentationsmodus
              </span>
              <span className="text-slate-300 font-bold">
                {isAutoRotating ? "Automatische Rotation aktiv" : "Manuelle Steuerung / Angehalten"}
              </span>
            </div>
          </div>

          {/* Quick tab jumper buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => handleManualSlideSelect(0)}
              className={`h-7 px-3 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                activeSlideIndex === 0
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                  : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Tabelle
            </button>

            {courtsList.map((court, idx) => (
              <button
                key={court}
                onClick={() => handleManualSlideSelect(idx + 1)}
                className={`h-7 px-3 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  activeSlideIndex === idx + 1
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                    : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850"
                }`}
              >
                <Tv className="h-3.5 w-3.5 text-slate-400" />
                {court}
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
