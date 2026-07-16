import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Users,
  Target,
  FileText,
  Settings,
  LayoutDashboard,
  Wifi,
  WifiOff,
  Plus,
  RefreshCw,
  Play,
  Tv,
  ChevronRight,
} from "lucide-react";
import { Tournament, AppSettings, TargetRoundScore, DistanceAttempt, SpecialOlympicsRound } from "./types";
import { StockAPI, loadSettings } from "./lib/api";

// Sub-components
import Dashboard from "./components/Dashboard";
import TournamentsTab from "./components/TournamentsTab";
import LiveEntryTab from "./components/LiveEntryTab";
import Reports from "./components/Reports";
import SettingsTab from "./components/SettingsTab";
import Scoreboard from "./components/Scoreboard";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    serverUrl: "",
    isOfflineMode: false,
    tvAutoScroll: true,
  });

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [path, setPath] = useState(window.location.pathname);

  // Monitor URL path changes for custom routing
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    const pathInterval = setInterval(() => {
      if (window.location.pathname !== path) {
        setPath(window.location.pathname);
      }
    }, 500);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(pathInterval);
    };
  }, [path]);

  // Load configuration and data
  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const currentSettings = loadSettings();
      setSettings(currentSettings);

      const list = await StockAPI.getTournaments();
      setTournaments(list);

      // Check server connection
      if (!currentSettings.isOfflineMode) {
        const targetUrl = currentSettings.serverUrl || window.location.origin;
        const conn = await StockAPI.checkConnection(targetUrl);
        setConnected(conn);
      } else {
        setConnected(false);
      }

      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Failed to fetch tournaments:", e);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData(true);
  }, []);

  // Live polling: Refresh data every 4 seconds to sync live scores instantly!
  // This is highly recommended for Stocksport tournaments with StockTV display!
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [settings]);

  // Selected tournament getter
  const activeTournament =
    tournaments.find((t) => t.id === activeTournamentId) ||
    tournaments.find((t) => t.status === "active" && !t.archived) ||
    tournaments.find((t) => !t.archived) ||
    null;

  // Intercept for Scoreboard view (Full-screen widescreen TV display)
  if (path.includes("/scoreboard")) {
    return (
      <Scoreboard
        onBackToAdmin={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  // Sync selected ID when activeTournament changes
  useEffect(() => {
    if (activeTournament && activeTournamentId === null) {
      setActiveTournamentId(activeTournament.id);
    }
  }, [activeTournament, activeTournamentId]);

  // Actions
  const handleCreateTournament = async (t: Partial<Tournament>) => {
    try {
      const created = await StockAPI.createTournament(t);
      setTournaments((prev) => [...prev, created]);
      setActiveTournamentId(created.id);
      setActiveTab("tournaments"); // navigate to config immediately
    } catch (err) {
      console.error("Error creating tournament", err);
    }
  };

  const handleUpdateTournament = async (id: string, updates: Partial<Tournament>) => {
    try {
      const updated = await StockAPI.updateTournament(id, updates);
      setTournaments((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error("Error updating tournament", err);
    }
  };

  const handleEnterMatchScore = async (
    tourneyId: string,
    matchId: string,
    scoreA: number,
    scoreB: number,
    status: "active" | "completed",
    isDQ?: boolean,
    dqTeamId?: string,
    isAbsent?: boolean,
    absentTeamId?: string
  ) => {
    try {
      const updated = await StockAPI.enterMatchScore(
        tourneyId,
        matchId,
        scoreA,
        scoreB,
        status,
        isDQ,
        dqTeamId,
        isAbsent,
        absentTeamId
      );
      setTournaments((prev) => prev.map((t) => (t.id === tourneyId ? updated : t)));
    } catch (err) {
      console.error("Error saving match score", err);
    }
  };

  const handleEnterTargetScore = async (
    tourneyId: string,
    participantId: string,
    scores: { round1?: number; round2?: number; round3?: number; round4?: number },
    rounds?: TargetRoundScore[],
    distanceAttempts?: DistanceAttempt[],
    specialOlympicsRounds?: SpecialOlympicsRound[],
    specialOlympicsLevel?: string,
    totalScore?: number
  ) => {
    try {
      const updated = await StockAPI.enterTargetScore(
        tourneyId,
        participantId,
        scores,
        rounds,
        distanceAttempts,
        specialOlympicsRounds,
        specialOlympicsLevel,
        totalScore
      );
      setTournaments((prev) => prev.map((t) => (t.id === tourneyId ? updated : t)));
    } catch (err) {
      console.error("Error saving target score", err);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    try {
      const success = await StockAPI.deleteTournament(id);
      if (success) {
        setTournaments((prev) => prev.filter((t) => t.id !== id));
        if (activeTournamentId === id) {
          setActiveTournamentId(null);
        }
      }
    } catch (err) {
      console.error("Error deleting tournament", err);
    }
  };

  // Nav tabs list
  const tabs = [
    { id: "dashboard", name: "Übersicht", icon: LayoutDashboard },
    { id: "tournaments", name: "Turniere", icon: Trophy },
    { id: "live-entry", name: "Eingabe", icon: Play },
    { id: "reports", name: "Drucken", icon: FileText },
    { id: "settings", name: "Einstellungen", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="stockapp-root">
      {/* Top Application Header / Status Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">
              Draugar <span className="text-indigo-600">Stock-Manager</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Stocksport Auswertung
            </p>
          </div>
        </div>

        {/* Sync/Connection indicators */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-400">
            <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
            <span>Auto-Sync: {lastRefreshed || "Wird geladen"}</span>
          </div>

          {settings.isOfflineMode ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
              <WifiOff className="h-3.5 w-3.5" />
              Lokal / Offline
            </span>
          ) : connected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Wifi className="h-3.5 w-3.5" />
              Verbunden
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <WifiOff className="h-3.5 w-3.5" />
              Kein Server
            </span>
          )}
        </div>
      </header>

      {/* Main Structural Wrapper */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* SIDEBAR FOR DESKTOP */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 p-4 flex-col gap-1.5 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
                id={`sidebar-tab-${tab.id}`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {tab.name}
              </button>
            );
          })}

          <div className="border-t border-slate-100 my-2.5 pt-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">StockTV Live</p>
            <button
              onClick={() => {
                window.location.href = "/scoreboard";
              }}
              className="w-full text-left p-3 rounded-xl text-xs font-black transition-all flex items-center gap-3 text-indigo-600 bg-indigo-50/35 hover:bg-indigo-50 hover:text-indigo-900 border border-indigo-100/30 cursor-pointer shadow-xs"
            >
              <Tv className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
              <span>Scoreboard (Auto)</span>
            </button>

            {/* List lane-specific scoreboards dynamically! */}
            {activeTournament && activeTournament.type === "team" && (
              <div className="mt-2 pl-3 space-y-1">
                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Einzelbahnen:</p>
                {Array.from(new Set(activeTournament.matches.map((m) => m.court))).sort().map((court, idx) => (
                  <button
                    key={court}
                    onClick={() => {
                      window.location.href = `/scoreboardbahn_${idx + 1}`;
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                    <span>{court}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* CONTAINER FOR TAB VIEW CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {loading ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-xs font-bold">Lade Turnierdaten...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === "dashboard" && (
                  <Dashboard
                    tournaments={tournaments}
                    onCreateClick={() => {
                      setActiveTournamentId(null);
                      setActiveTab("tournaments");
                    }}
                    onSelectTournament={(id) => {
                      setActiveTournamentId(id);
                    }}
                    onNavigate={(tab) => {
                      setActiveTab(tab);
                    }}
                  />
                )}

                {activeTab === "tournaments" && (
                  <TournamentsTab
                    tournaments={tournaments}
                    onCreateTournament={handleCreateTournament}
                    onUpdateTournament={handleUpdateTournament}
                    onDeleteTournament={handleDeleteTournament}
                    onSelectTournament={(id) => {
                      setActiveTournamentId(id);
                    }}
                    activeTournament={activeTournament}
                  />
                )}

                {activeTab === "live-entry" && (
                  <LiveEntryTab
                    tournaments={tournaments}
                    activeTournament={activeTournament}
                    onSelectTournament={(id) => {
                      setActiveTournamentId(id);
                    }}
                    onEnterMatchScore={handleEnterMatchScore}
                    onEnterTargetScore={handleEnterTargetScore}
                  />
                )}

                {activeTab === "reports" && <Reports activeTournament={activeTournament} />}

                {activeTab === "settings" && (
                  <SettingsTab
                    onSettingsChanged={() => {
                      loadData(false);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* BOTTOM NAVIGATION BAR FOR MOBILE AND APK (TOUCH TARGETS & HIGH DENSITY) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
                  isActive ? "text-indigo-600 font-bold" : "text-slate-400"
                }`}
                style={{ minWidth: "48px", minHeight: "48px" }} // Mobile touch target size limit
                id={`mobile-tab-${tab.id}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span className="text-[10px] tracking-tight leading-none">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
