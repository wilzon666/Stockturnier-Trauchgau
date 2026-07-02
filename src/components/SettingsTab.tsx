import React, { useState, useEffect } from "react";
import {
  Settings,
  Server,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { AppSettings } from "../types";
import { loadSettings, saveSettings, StockAPI } from "../lib/api";

interface SettingsTabProps {
  onSettingsChanged: () => void;
}

export default function SettingsTab({ onSettingsChanged }: SettingsTabProps) {
  const [settings, setSettings] = useState<AppSettings>({
    serverUrl: "",
    isOfflineMode: false,
    tvAutoScroll: true,
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<"success" | "fail" | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSave = (updated: AppSettings) => {
    setSettings(updated);
    saveSettings(updated);
    onSettingsChanged();
  };

  const testServerConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      // If serverUrl is empty, use current window.location.origin
      const targetUrl = settings.serverUrl || window.location.origin;
      const connected = await StockAPI.checkConnection(targetUrl);
      setConnectionResult(connected ? "success" : "fail");
    } catch {
      setConnectionResult("fail");
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="settings-tab">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-600" />
          Einstellungen
        </h2>
        <p className="text-xs text-slate-500">
          Konfigurieren Sie den Verbindungsmodus Ihres Draugar Stock-Managers und verwalten Sie die Server-Synchronisation.
        </p>
      </div>

      {/* Connection Mode Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <Server className="h-4.5 w-4.5 text-indigo-600" />
          Container-Backend & Synchronisation
        </h3>

        <div className="space-y-4 text-xs">
          {/* Offline mode toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {settings.isOfflineMode ? (
                  <WifiOff className="h-4 w-4 text-rose-500" />
                ) : (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                )}
                Offline-Modus (Lokaler Speicher)
              </span>
              <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                Wenn aktiviert, speichert die App alle Turniere und Spielstände direkt auf dem Gerät (localStorage).
                Ideal für Eisbahnen ohne Internetverbindung oder für Testzwecke.
              </p>
            </div>

            <button
              onClick={() => {
                const updated = { ...settings, isOfflineMode: !settings.isOfflineMode };
                handleSave(updated);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.isOfflineMode ? "bg-rose-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.isOfflineMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Server URL inputs */}
          {!settings.isOfflineMode && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-bold text-slate-600 uppercase text-[10px]">
                  Backend Server URL *
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="url"
                    placeholder="z.B. http://192.168.1.100:3000 oder https://meine-server-ip:3000"
                    value={settings.serverUrl}
                    onChange={(e) => {
                      const updated = { ...settings, serverUrl: e.target.value };
                      handleSave(updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-slate-50/50 focus:bg-white transition-colors"
                  />

                  <button
                    onClick={testServerConnection}
                    disabled={testingConnection}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {testingConnection ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Verbindung testen"
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Leer lassen, um die aktuelle Host-URL zu verwenden (empfohlen für das Ausführen im Container).
                </p>
              </div>

              {/* Connection Feedback */}
              {connectionResult && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 font-semibold ${
                    connectionResult === "success"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : "bg-rose-50 border-rose-100 text-rose-800"
                  }`}
                >
                  {connectionResult === "success" ? (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      Erfolgreich verbunden! Das Backend antwortet einwandfrei.
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4.5 w-4.5 text-rose-500" />
                      Verbindung fehlgeschlagen. Bitte prüfen Sie die URL und stellen Sie sicher, dass das Backend erreichbar ist.
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Guide/Help Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <HelpCircle className="h-4.5 w-4.5 text-indigo-600" />
          Anleitung: Auf anderen Geräten nutzen
        </h3>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Da dieser <strong>Draugar Stock-Manager</strong> in einem Docker-Container auf Ihrem Server läuft, können Sie die Web-GUI von jedem beliebigen Smartphone, Tablet oder Laptop im selben Netzwerk aufrufen:
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>IP-Adresse Ihres Servers ermitteln:</strong> Finden Sie die lokale IP-Adresse des Servers heraus, auf dem Portainer läuft (z.B. <code>192.168.1.100</code>).
            </li>
            <li>
              <strong>Browser aufrufen:</strong> Öffnen Sie auf dem Smartphone oder Tablet den Webbrowser und geben Sie die Adresse ein (z.B. <code>http://192.168.1.100:3000</code>).
            </li>
            <li>
              <strong>Live-Spielstände eintragen:</strong> Sie können das Smartphone jetzt direkt an der Bahn verwenden, um Spielstände live einzugeben. Alles wird sofort synchronisiert!
            </li>
            <li>
              <strong>StockTV aufrufen:</strong> Rufen Sie auf einem Smart-TV oder Laptop die TV-Ansicht auf (z.B. <code>http://192.168.1.100:3000/tv</code> bzw. über den Button oben), um die Live-Ergebnisse für Zuschauer anzuzeigen.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
