import { useState } from "react";
import { Printer, FileText, Download, Award, Shield, Users, Target } from "lucide-react";
import { Tournament } from "../types";
import { computeTeamRankings, computeSpecialTournamentRankings } from "../lib/api";

interface ReportsProps {
  activeTournament: Tournament | null;
}

export default function Reports({ activeTournament }: ReportsProps) {
  const [reportType, setReportType] = useState<"results" | "scorecards" | "courts">("results");
  const [selectedCourt, setSelectedCourt] = useState<string>("");

  if (!activeTournament) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400" id="reports-tab">
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-700">Kein Turnier ausgewählt</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Wählen Sie ein Turnier im Dashboard oder Turnier-Tab aus, um offizielle Berichte und Wertungskarten zu drucken.
        </p>
      </div>
    );
  }

  // Calculate team rankings
  const teamRankings = activeTournament.type === "team"
    ? computeTeamRankings(activeTournament.teams, activeTournament.matches)
    : [];

  const groupAStandings = activeTournament.isSpecialThreeLaneMode 
    ? computeTeamRankings(activeTournament.teams.filter(t => t.group === "Gruppe A" || !t.group), activeTournament.matches.filter(m => m.phase === "vorrunde" || !m.phase))
    : [];
  const groupBStandings = activeTournament.isSpecialThreeLaneMode 
    ? computeTeamRankings(activeTournament.teams.filter(t => t.group === "Gruppe B"), activeTournament.matches.filter(m => m.phase === "vorrunde" || !m.phase))
    : [];
  const overallSpecialStandings = activeTournament.isSpecialThreeLaneMode
    ? computeSpecialTournamentRankings(activeTournament)
    : [];

  // Calculate individual rankings (Target, Distance, Special Olympics)
  const individualRankings = activeTournament.type !== "team"
    ? [...activeTournament.targetParticipants].sort((a, b) => b.totalScore - a.totalScore)
    : [];

  const handlePrint = () => {
    window.print();
  };

  // Courts list for court sheets
  const courtsList = activeTournament.type === "team"
    ? Array.from(new Set(activeTournament.matches.map((m) => m.court))).sort()
    : [];

  return (
    <div className="space-y-6" id="reports-tab">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 bg-white p-4 rounded-xl shadow-xs print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Drucken & Berichte</h2>
          <p className="text-xs text-slate-500">
            Generieren Sie offizielle Ergebnislisten, Bahnblöcke oder Schiedsrichter-Wertungskarten.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-sm"
        >
          <Printer className="h-4 w-4" />
          Bericht drucken (PDF)
        </button>
      </div>

      {/* Screen view controls (does not print) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation / Selection Sidebar */}
        <div className="space-y-2 print:hidden">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Verfügbare Berichte
          </h3>

          <button
            onClick={() => setReportType("results")}
            className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === "results"
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
            }`}
          >
            <Award className="h-4 w-4" />
            Offizielle Ergebnisliste
          </button>

          {activeTournament.type === "team" && (
            <>
              <button
                onClick={() => setReportType("scorecards")}
                className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                  reportType === "scorecards"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                }`}
              >
                <FileText className="h-4 w-4" />
                Spielberichte / Wertungskarte
              </button>

              <button
                onClick={() => setReportType("courts")}
                className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                  reportType === "courts"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                }`}
              >
                <Users className="h-4 w-4" />
                Bahnblock-Blatt
              </button>
            </>
          )}
        </div>

        {/* Live Preview Box */}
        <div className="md:col-span-3 space-y-4">
          {/* Options inside preview */}
          {reportType === "courts" && (
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center gap-3 text-xs print:hidden">
              <span className="font-semibold text-slate-500">Bahn filtern:</span>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus:outline-none"
              >
                <option value="">-- Alle Bahnen --</option>
                {courtsList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border border-slate-100 bg-white rounded-2xl p-6 shadow-xs min-h-[400px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100 mb-6 print:hidden">
              Vorschau (Layout für Papierdruck optimiert)
            </p>

            {/* PRINT WRAPPER */}
            <div className="print-area bg-white text-slate-900 leading-normal font-sans" id="printable-report">
              {/* PAGE 1: REPORT HEADER */}
              <div className="text-center pb-6 border-b-2 border-slate-800 space-y-4">
                {activeTournament.sponsorImage && (
                  <div className="flex justify-center max-h-24 print:max-h-20">
                    <img
                      src={activeTournament.sponsorImage}
                      alt="Sponsor Logo"
                      className="max-h-24 print:max-h-20 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-widest text-indigo-600 print:text-black uppercase">
                    {activeTournament.association || "Bund Österreichischer Eis- und Stocksportler | DESV (Deutscher Eisstock-Verband)"}
                  </p>
                  <h1 className="text-2xl font-black text-slate-900 uppercase">{activeTournament.name}</h1>
                  <p className="text-xs font-bold text-slate-500 print:text-slate-700">
                    Veranstalter: {activeTournament.location} | Datum: {activeTournament.date} {activeTournament.rulesVersion ? `| Regelwerk: ${activeTournament.rulesVersion}` : ""}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">Erstellt mit dem Draugar Stock-Manager - Die Auswertungs-App für den Stocksport</p>
                </div>
              </div>

              {/* REPORT TYPE 1: RESULTS LIST */}
              {reportType === "results" && (
                <div className="mt-6 space-y-6">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 text-center">
                    Offizielle Ergebnisliste
                  </h2>

                  {activeTournament.type === "team" ? (
                    activeTournament.isSpecialThreeLaneMode ? (
                      <div className="space-y-8">
                        {/* Gruppe A Vorrunde */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                            <span>Vorrunde: Gruppe A</span>
                            <span className="text-[9px] text-slate-400 font-normal">4 Kehren pro Spiel</span>
                          </h3>
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                                <th className="py-2 text-center w-12">Rang</th>
                                <th className="py-2">Mannschaft / Verein</th>
                                <th className="py-2 text-center w-12">Spiele</th>
                                <th className="py-2 text-center w-20">Spielpunkte</th>
                                <th className="py-2 text-center w-20">Stockpunkte</th>
                                <th className="py-2 text-center w-16">Diff.</th>
                                <th className="py-2 text-center w-16 text-indigo-700 font-black">Stocknote</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {groupAStandings.map((row, idx) => (
                                <tr key={row.teamId} className="hover:bg-slate-50 font-medium">
                                  <td className="py-2 text-center font-bold text-slate-900">{idx + 1}</td>
                                  <td className="py-2 font-bold text-slate-900">{row.teamName}</td>
                                  <td className="py-2 text-center">{row.matchesPlayed}</td>
                                  <td className="py-2 text-center font-mono font-bold">
                                    {row.matchPointsPositive}:{row.matchPointsNegative}
                                  </td>
                                  <td className="py-2 text-center font-mono">
                                    {row.stockPointsPositive}:{row.stockPointsNegative}
                                  </td>
                                  <td className="py-2 text-center font-mono">
                                    {row.stockPointsDiff > 0 ? `+${row.stockPointsDiff}` : row.stockPointsDiff}
                                  </td>
                                  <td className="py-2 text-center font-mono font-black text-indigo-600 print:text-black">
                                    {row.stockNote.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Gruppe B Vorrunde */}
                        <div className="space-y-2 pt-2">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                            <span>Vorrunde: Gruppe B</span>
                            <span className="text-[9px] text-slate-400 font-normal">4 Kehren pro Spiel</span>
                          </h3>
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                                <th className="py-2 text-center w-12">Rang</th>
                                <th className="py-2">Mannschaft / Verein</th>
                                <th className="py-2 text-center w-12">Spiele</th>
                                <th className="py-2 text-center w-20">Spielpunkte</th>
                                <th className="py-2 text-center w-20">Stockpunkte</th>
                                <th className="py-2 text-center w-16">Diff.</th>
                                <th className="py-2 text-center w-16 text-indigo-700 font-black">Stocknote</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {groupBStandings.map((row, idx) => (
                                <tr key={row.teamId} className="hover:bg-slate-50 font-medium">
                                  <td className="py-2 text-center font-bold text-slate-900">{idx + 1}</td>
                                  <td className="py-2 font-bold text-slate-900">{row.teamName}</td>
                                  <td className="py-2 text-center">{row.matchesPlayed}</td>
                                  <td className="py-2 text-center font-mono font-bold">
                                    {row.matchPointsPositive}:{row.matchPointsNegative}
                                  </td>
                                  <td className="py-2 text-center font-mono">
                                    {row.stockPointsPositive}:{row.stockPointsNegative}
                                  </td>
                                  <td className="py-2 text-center font-mono">
                                    {row.stockPointsDiff > 0 ? `+${row.stockPointsDiff}` : row.stockPointsDiff}
                                  </td>
                                  <td className="py-2 text-center font-mono font-black text-indigo-600 print:text-black">
                                    {row.stockNote.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Overall Special Placement Standings */}
                        <div className="space-y-2 pt-4 border-t-2 border-dashed border-slate-300">
                          <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider border-b border-indigo-200 pb-1.5 flex items-center justify-between">
                            <span>Gesamtwertung (Finaler Endstand nach Platzierungsspielen)</span>
                            {!activeTournament.matches.some(m => m.phase === "platzierung" && m.status === "completed") ? (
                              <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Provisorisch</span>
                            ) : (
                              <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Offiziell</span>
                            )}
                          </h3>
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                                <th className="py-2 text-center w-12">Rang</th>
                                <th className="py-2">Mannschaft / Verein</th>
                                <th className="py-2 text-center w-24">Vorrunde-Gruppe</th>
                                <th className="py-2 text-center w-24">Vorrunde-Rang</th>
                                <th className="py-2 text-center w-12">Spiele</th>
                                <th className="py-2 text-center w-20">Spielpunkte</th>
                                <th className="py-2 text-center w-16 text-indigo-700 font-black">Stocknote</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {overallSpecialStandings.map((row) => (
                                <tr key={row.teamId} className="hover:bg-slate-50 font-medium">
                                  <td className="py-2 text-center font-black text-slate-900 bg-slate-50">{row.rank}</td>
                                  <td className="py-2 font-bold text-slate-900">{row.teamName}</td>
                                  <td className="py-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      row.groupName === "Gruppe B" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                                    }`}>
                                      {row.groupName}
                                    </span>
                                  </td>
                                  <td className="py-2 text-center font-semibold text-slate-500">Platz {row.groupRank}</td>
                                  <td className="py-2 text-center">{row.matchesPlayed}</td>
                                  <td className="py-2 text-center font-mono font-bold">
                                    {row.matchPointsPositive}:{row.matchPointsNegative}
                                  </td>
                                  <td className="py-2 text-center font-mono font-black text-indigo-600 print:text-black">
                                    {row.stockNote.toFixed(3)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                            <th className="py-2 text-center w-12">Rang</th>
                            <th className="py-2">Mannschaft / Verein</th>
                            <th className="py-2 text-center w-12">Spiele</th>
                            <th className="py-2 text-center w-20">Spielpunkte</th>
                            <th className="py-2 text-center w-20">Stockpunkte</th>
                            <th className="py-2 text-center w-16">Diff.</th>
                            <th className="py-2 text-center w-16 text-indigo-700 font-black">Stocknote</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {teamRankings.map((row, idx) => (
                            <tr key={row.teamId} className="hover:bg-slate-50 font-medium">
                              <td className="py-2.5 text-center font-bold text-slate-900">{idx + 1}</td>
                              <td className="py-2.5">
                                <p className="font-bold text-slate-900">{row.teamName}</p>
                                {row.club && <p className="text-[10px] text-slate-400 print:hidden">{row.club}</p>}
                              </td>
                              <td className="py-2.5 text-center">{row.matchesPlayed}</td>
                              <td className="py-2.5 text-center font-mono font-bold">
                                {row.matchPointsPositive}:{row.matchPointsNegative}
                              </td>
                              <td className="py-2.5 text-center font-mono">
                                {row.stockPointsPositive}:{row.stockPointsNegative}
                              </td>
                              <td className="py-2.5 text-center font-mono">
                                {row.stockPointsDiff > 0 ? `+${row.stockPointsDiff}` : row.stockPointsDiff}
                              </td>
                              <td className="py-2.5 text-center font-mono font-black text-indigo-600 print:text-black">
                                {row.stockNote.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    activeTournament.type === "distance" ? (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                            <th className="py-2 text-center w-12">Rang</th>
                            <th className="py-2">Name des Schützen</th>
                            <th className="py-2">Verein</th>
                            <th className="py-2 text-center w-24">Erfasste Runden</th>
                            <th className="py-2 text-center w-24 font-black text-indigo-700">Beste Weite (m)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {individualRankings.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50 font-medium">
                              <td className="py-2.5 text-center font-bold text-slate-900">{idx + 1}</td>
                              <td className="py-2.5 font-bold">{p.playerName}</td>
                              <td className="py-2.5">{p.clubName}</td>
                              <td className="py-2.5 text-center font-mono">
                                {p.distanceAttempts?.length || 0}
                              </td>
                              <td className="py-2.5 text-center font-mono font-black text-indigo-600 print:text-black text-sm">
                                {p.totalScore} m
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : activeTournament.type === "special-olympics" ? (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                            <th className="py-2 text-center w-12">Rang</th>
                            <th className="py-2">Name des Schützen</th>
                            <th className="py-2">Verein</th>
                            <th className="py-2 text-center w-20">SO Level</th>
                            <th className="py-2 text-center w-24">Erfasste Runden</th>
                            <th className="py-2 text-center w-24 font-black text-indigo-700">Gesamtpunkte</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {individualRankings.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50 font-medium">
                              <td className="py-2.5 text-center font-bold text-slate-900">{idx + 1}</td>
                              <td className="py-2.5 font-bold">{p.playerName}</td>
                              <td className="py-2.5">{p.clubName}</td>
                              <td className="py-2.5 text-center">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold">
                                  {p.specialOlympicsLevel || "-"}
                                </span>
                              </td>
                              <td className="py-2.5 text-center font-mono">
                                {p.specialOlympicsRounds?.length || 0}
                              </td>
                              <td className="py-2.5 text-center font-mono font-black text-indigo-600 print:text-black text-sm">
                                {p.totalScore} Pkt.
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                            <th className="py-2 text-center w-12">Rang</th>
                            <th className="py-2">Name des Schützen</th>
                            <th className="py-2">Verein</th>
                            <th className="py-2 text-center w-12">DG 1</th>
                            <th className="py-2 text-center w-12">DG 2</th>
                            <th className="py-2 text-center w-12">DG 3</th>
                            <th className="py-2 text-center w-12">DG 4</th>
                            <th className="py-2 text-center w-24 font-black text-indigo-700">Gesamtpunkte</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {individualRankings.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50 font-medium">
                              <td className="py-2.5 text-center font-bold text-slate-900">{idx + 1}</td>
                              <td className="py-2.5 font-bold">{p.playerName}</td>
                              <td className="py-2.5">{p.clubName}</td>
                              <td className="py-2.5 text-center font-mono">{p.scores?.round1 || 0}</td>
                              <td className="py-2.5 text-center font-mono">{p.scores?.round2 || 0}</td>
                              <td className="py-2.5 text-center font-mono">{p.scores?.round3 || 0}</td>
                              <td className="py-2.5 text-center font-mono">{p.scores?.round4 || 0}</td>
                              <td className="py-2.5 text-center font-mono font-black text-indigo-600 print:text-black text-sm">
                                {p.totalScore}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}

                  {/* Signatures for official printed sheet */}
                  <div className="grid grid-cols-3 gap-6 pt-12 border-t border-dashed border-slate-300 text-center text-[10px] uppercase font-bold text-slate-500 mt-12">
                    <div className="space-y-10">
                      <p className="font-semibold text-slate-700 min-h-[20px]">{activeTournament.referee || "Offen"}</p>
                      <div className="border-b border-slate-400 mx-4"></div>
                      <p>Schiedsrichter</p>
                    </div>
                    <div className="space-y-10">
                      <p className="font-semibold text-slate-700 min-h-[20px]">{activeTournament.competitionLeader || "Offen"}</p>
                      <div className="border-b border-slate-400 mx-4"></div>
                      <p>Wettbewerbsleiter</p>
                    </div>
                    <div className="space-y-10">
                      <p className="font-semibold text-slate-700 min-h-[20px]">{activeTournament.clerk || "Offen"}</p>
                      <div className="border-b border-slate-400 mx-4"></div>
                      <p>Auswertung / Rechenbüro</p>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT TYPE 2: INDIVIDUAL MATCH REPORTS / SCORECARDS */}
              {reportType === "scorecards" && activeTournament.type === "team" && (
                <div className="mt-6 space-y-8">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 text-center">
                    Spielberichte / Wertungskarten
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                    {activeTournament.matches.slice(0, 8).map((match) => {
                      const teamA = activeTournament.teams.find((t) => t.id === match.teamAId)?.name || "Unbekannt";
                      const teamB = activeTournament.teams.find((t) => t.id === match.teamBId)?.name || "Unbekannt";
                      return (
                        <div key={match.id} className="border-2 border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/20">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 pb-1.5">
                            <span>Runde {match.round}</span>
                            <span>{match.court}</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span>(A) {teamA}</span>
                              <span className="w-16 h-8 border border-slate-400 rounded bg-white flex items-center justify-center font-mono font-black text-base">
                                {match.teamAScore !== null ? match.teamAScore : ""}
                              </span>
                            </div>

                            <div className="flex justify-between items-center font-bold">
                              <span>(B) {teamB}</span>
                              <span className="w-16 h-8 border border-slate-400 rounded bg-white flex items-center justify-center font-mono font-black text-base">
                                {match.teamBScore !== null ? match.teamBScore : ""}
                              </span>
                            </div>
                          </div>

                          {/* Signature line for players */}
                          <div className="grid grid-cols-2 gap-4 pt-6 text-[8px] uppercase font-bold text-slate-400 text-center">
                            <div>
                              <div className="border-b border-slate-300 mx-2 mb-1"></div>
                              <p>Unterschrift Team A</p>
                            </div>
                            <div>
                              <div className="border-b border-slate-300 mx-2 mb-1"></div>
                              <p>Unterschrift Team B</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* REPORT TYPE 3: LANE SCORE SHEETS / BAHNBLÖCKE */}
              {reportType === "courts" && activeTournament.type === "team" && (
                <div className="mt-6 space-y-6">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 text-center">
                    Bahnblock-Blatt
                  </h2>

                  <p className="text-xs text-slate-600 print:text-black font-semibold">
                    Übersicht über alle geplanten Spiele auf der Bahn:{" "}
                    <strong className="text-indigo-600 print:text-black">
                      {selectedCourt || "Alle Bahnen"}
                    </strong>
                  </p>

                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-800 font-bold uppercase text-[9px] text-slate-600">
                        <th className="py-2 w-16">Runde</th>
                        <th className="py-2 w-24">Bahn</th>
                        <th className="py-2">Begegnung (Mannschaft A vs. Mannschaft B)</th>
                        <th className="py-2 text-center w-36">Ergebnis (A : B)</th>
                        <th className="py-2 text-center w-24">Handzeichen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeTournament.matches
                        .filter((m) => !selectedCourt || m.court === selectedCourt)
                        .map((match) => {
                          const teamA = activeTournament.teams.find((t) => t.id === match.teamAId)?.name || "Unbekannt";
                          const teamB = activeTournament.teams.find((t) => t.id === match.teamBId)?.name || "Unbekannt";
                          return (
                            <tr key={match.id} className="font-medium">
                              <td className="py-3 font-bold text-slate-900">Runde {match.round}</td>
                              <td className="py-3 font-semibold">{match.court}</td>
                              <td className="py-3 text-slate-800 font-bold">
                                {teamA} <span className="font-normal text-slate-400">gegen</span> {teamB}
                              </td>
                              <td className="py-3 text-center">
                                <span className="inline-block w-28 h-7 border border-slate-300 rounded bg-white font-mono font-bold text-center leading-7">
                                  {match.teamAScore !== null ? `${match.teamAScore} : ${match.teamBScore}` : "      :      "}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <div className="w-16 h-6 border-b border-slate-300 mx-auto"></div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Print Media styling - injected via standard react styled-jsx or inline-style */}
      <style>{`
        @media print {
          /* Reset height and overflow of all parent containers to allow multi-page flow and prevent clipping/empty pages */
          html, body, #root, .min-h-screen, main, .flex-1 {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
          }

          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
