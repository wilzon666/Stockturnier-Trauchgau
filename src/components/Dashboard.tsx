import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Trophy, Play, Settings, Shield, Plus, Calendar, MapPin, Users, Target, BookOpen, ExternalLink, FileText } from "lucide-react";
import { Tournament } from "../types";

interface DashboardProps {
  tournaments: Tournament[];
  onCreateClick: () => void;
  onSelectTournament: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({
  tournaments,
  onCreateClick,
  onSelectTournament,
  onNavigate,
}: DashboardProps) {
  const activeTournaments = tournaments.filter((t) => t.status === "active" && !t.archived);
  const plannedTournaments = tournaments.filter((t) => t.status === "planned" && !t.archived);
  const completedTournaments = tournaments.filter((t) => t.status === "completed" && !t.archived);

  const [rulesTab, setRulesTab] = useState<"team" | "target">("team");

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Hero Header Greeting card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 p-6 text-white shadow-xl"
        id="dashboard-hero"
      >
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-6 -mb-6 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3, py-1 text-xs font-semibold text-cyan-300">
              <Shield className="h-3 w-3" />
              Offizielle Auswertung
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              Willkommen beim <span className="text-cyan-300">Draugar Stock-Manager</span>
            </h1>
            <p className="mt-1.5 text-sm text-blue-200 max-w-xl">
              Das moderne Auswertungstool für den Stocksport. Verwalten Sie Teambewerbe und Zielschiessen,
              erfassen Sie Spielstände live.
            </p>
          </div>

          <button
            onClick={onCreateClick}
            className="self-start md:self-center inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-300 active:scale-95 shadow-md shadow-cyan-400/20"
            id="btn-create-tourney"
          >
            <Plus className="h-4 w-4" />
            Neues Turnier
          </button>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="text-center md:text-left">
            <p className="text-xs text-blue-200">Aktiv & Live</p>
            <p className="text-xl font-bold text-cyan-300">{activeTournaments.length}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-blue-200 font-normal">Geplant</p>
            <p className="text-xl font-bold text-white">{plannedTournaments.length}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-blue-200">Abgeschlossen</p>
            <p className="text-xl font-bold text-slate-300">{completedTournaments.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Tournaments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2" id="header-turniere">
              <Trophy className="h-5 w-5 text-indigo-600" />
              Aktuelle Turniere
            </h2>
            <button
              onClick={() => onNavigate("tournaments")}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Alle anzeigen
            </button>
          </div>

          {activeTournaments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center" id="empty-state">
              <Trophy className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-sm font-semibold text-slate-800">Keine aktiven Turniere</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Aktuell läuft kein Turnier. Erstellen Sie ein neues Turnier oder aktivieren Sie ein bestehendes.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={onCreateClick}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Erstellen
                </button>
                <button
                  onClick={() => onNavigate("tournaments")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Turnierliste
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4" id="active-tournaments-list">
              {activeTournaments.map((tournament) => (
                <motion.div
                  key={tournament.id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  id={`tourney-card-${tournament.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tournament.type === "team"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {tournament.type === "team" ? (
                          <>
                            <Users className="h-2.5 w-2.5" /> Teambewerb
                          </>
                        ) : (
                          <>
                            <Target className="h-2.5 w-2.5" /> Zielbewerb
                          </>
                        )}
                      </span>
                      <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                      <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">LIVE</span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base">{tournament.name}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {tournament.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {tournament.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectTournament(tournament.id);
                        onNavigate("tournaments");
                      }}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                      <Trophy className="h-3.5 w-3.5" /> Dashboard
                    </button>
                    <button
                      onClick={() => {
                        onSelectTournament(tournament.id);
                        onNavigate("live-entry");
                      }}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Play className="h-3.5 w-3.5 text-slate-400" /> Eingabe
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Planned / Upcoming Tournaments */}
          {plannedTournaments.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Geplante Turniere</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plannedTournaments.slice(0, 4).map((tournament) => (
                  <div
                    key={tournament.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-sm cursor-pointer"
                    onClick={() => {
                      onSelectTournament(tournament.id);
                      onNavigate("tournaments");
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {tournament.type === "team" ? "Teambewerb" : "Zielbewerb"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{tournament.date}</span>
                    </div>
                    <h4 className="mt-1 font-bold text-slate-700 text-sm line-clamp-1">{tournament.name}</h4>
                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {tournament.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Information, Quick Links, Help */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Quick-Info
          </h2>

          <div className="rounded-2xl border border-slate-100 bg-emerald-50/50 p-5 space-y-4">
            <h3 className="font-bold text-emerald-900 text-sm">Web-GUI Modus</h3>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Sie nutzen den <strong>Draugar Stock-Manager</strong> direkt als Web-Applikation im Browser. Alle Turniere und Ergebnisse werden sicher in Echtzeit auf Ihrem Server gespeichert.
            </p>
            <div className="bg-white rounded-lg p-3 border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-900">Daten-Speicherung</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Server-Datenbank
              </span>
            </div>
            <button
              onClick={() => onNavigate("settings")}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Settings className="h-3.5 w-3.5" /> Zu den Einstellungen
            </button>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm" id="rules-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Stocksport-Regelwerk</h3>
              </div>
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                IER 2022
              </span>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setRulesTab("team")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rulesTab === "team"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Teambewerb
              </button>
              <button
                onClick={() => setRulesTab("target")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rulesTab === "target"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Zielbewerb
              </button>
            </div>

            {/* Interactive Rules Content */}
            <div className="min-h-[220px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {rulesTab === "team" ? (
                  <motion.div
                    key="team-rules"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3 text-xs text-slate-600"
                  >
                    <div>
                      <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                        Ziel des Mannschaftsspiels
                      </h4>
                      <p className="mt-0.5 text-slate-500 leading-relaxed pl-3">
                        Die eigenen Stöcke näher an die Daube (Zielobjekt im Zielfeld) bringen als der Gegner.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                        Kehren & Matchpunkte
                      </h4>
                      <p className="mt-0.5 text-slate-500 leading-relaxed pl-3">
                        Standardmäßig 6 Kehren. Sieg ergibt <strong>2:0</strong> Matchpunkte, Unentschieden <strong>1:1</strong>, Niederlage <strong>0:2</strong>. Im 3-Bahnen Modus spielt die Vorrunde 4 Kehren.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                        Wertung & Stocknote
                      </h4>
                      <p className="mt-0.5 text-slate-500 leading-relaxed pl-3">
                        Der bestplatzierte Stock erhält 3 Punkte, jeder weitere eigene (näher als der beste gegnerische) Stock 2 Punkte (max. 9 pro Kehre). Die <strong>Stocknote</strong> (Eigene / Gegnerische Punkte) entscheidet bei Gleichstand.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="target-rules"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3 text-xs text-slate-600"
                  >
                    <p className="text-slate-500 leading-relaxed pb-1">
                      Einzelwettbewerb aus 4 Durchgängen à 6 Schüsse (max. 50 Punkte pro Durchgang):
                    </p>

                    <div className="grid grid-cols-1 gap-2 pl-1">
                      <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <span className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider block font-mono">DG 1: Massen im Zentrum</span>
                        <span className="text-slate-500">Schüsse auf die konzentrischen Ringe der Zielscheibe (2 bis 10 Punkte).</span>
                      </div>
                      
                      <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <span className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider block font-mono">DG 2: Stockschiessen</span>
                        <span className="text-slate-500">Gezielter Schuss auf im Zielfeld platzierte Zielstöcke (Ablenken).</span>
                      </div>

                      <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <span className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider block font-mono">DG 3: Massen in die Ringe</span>
                        <span className="text-slate-500">Platzieren in markierten Zielringen in den hinteren bzw. vorderen Ecken.</span>
                      </div>

                      <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <span className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider block font-mono">DG 4: Platzieren/Anlegen</span>
                        <span className="text-slate-500">Gefordertes nahes Anlegen an andere Stöcke bzw. Platzieren.</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PDF Rules download link */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <a
                  href="https://www.stocksport-austria.at/wp-content/uploads/2022/11/Int.-Eisstock-Regeln_IER-Regelbuch-2022.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-600 shadow-sm"
                >
                  <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Offizielles IER Regelbuch (PDF)</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 ml-0.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
