import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Tournament } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to JSON file database
const dbDir = path.join(process.cwd(), "src", "data");
const dbPath = path.join(dbDir, "db.json");

// Helper to ensure database file exists and load it
function loadDatabase() {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({ tournaments: [] }, null, 2));
      return { tournaments: [] };
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading database:", error);
    return { tournaments: [] };
  }
}

// Helper to save database file
function saveDatabase(data: { tournaments: Tournament[] }) {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database:", error);
  }
}

// Enable CORS for API routes so the APK frontend can communicate with it
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// GET all tournaments
app.get("/api/tournaments", (req, res) => {
  const db = loadDatabase();
  res.json(db.tournaments);
});

// GET single tournament
app.get("/api/tournaments/:id", (req, res) => {
  const db = loadDatabase();
  const tournament = db.tournaments.find((t: Tournament) => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  res.json(tournament);
});

// POST create tournament
app.post("/api/tournaments", (req, res) => {
  const db = loadDatabase();
  const newTournament: Tournament = {
    id: "t-" + Date.now(),
    name: req.body.name || "Neues Turnier",
    date: req.body.date || new Date().toISOString().split("T")[0],
    type: req.body.type || "team",
    location: req.body.location || "Stocksportplatz",
    status: req.body.status || "planned",
    teams: req.body.teams || [],
    matches: req.body.matches || [],
    targetParticipants: req.body.targetParticipants || [],
    kehrenCount: req.body.kehrenCount || (req.body.type === "target" ? 4 : 6)
  };

  db.tournaments.push(newTournament);
  saveDatabase(db);
  res.status(201).json(newTournament);
});

// PUT update tournament
app.put("/api/tournaments/:id", (req, res) => {
  const db = loadDatabase();
  const index = db.tournaments.findIndex((t: Tournament) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Tournament not found" });
  }

  const updatedTournament = {
    ...db.tournaments[index],
    ...req.body,
    id: req.params.id // lock the ID
  };

  db.tournaments[index] = updatedTournament;
  saveDatabase(db);
  res.json(updatedTournament);
});

// POST enter match score for Team tournament
app.post("/api/tournaments/:id/matches/:matchId", (req, res) => {
  const db = loadDatabase();
  const tournament = db.tournaments.find((t: Tournament) => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found" });
  }

  const match = tournament.matches.find((m) => m.id === req.params.matchId);
  if (!match) {
    return res.status(404).json({ error: "Match not found" });
  }

  match.teamAScore = req.body.teamAScore !== undefined ? req.body.teamAScore : null;
  match.teamBScore = req.body.teamBScore !== undefined ? req.body.teamBScore : null;
  match.status = req.body.status || "completed";
  match.isDQ = req.body.isDQ !== undefined ? req.body.isDQ : undefined;
  match.dqTeamId = req.body.dqTeamId !== undefined ? req.body.dqTeamId : undefined;
  match.isAbsent = req.body.isAbsent !== undefined ? req.body.isAbsent : undefined;
  match.absentTeamId = req.body.absentTeamId !== undefined ? req.body.absentTeamId : undefined;
  match.timestamp = Date.now();

  saveDatabase(db);
  res.json(tournament);
});

// POST update target score for Target tournament
app.post("/api/tournaments/:id/target/:participantId", (req, res) => {
  const db = loadDatabase();
  const tournament = db.tournaments.find((t: Tournament) => t.id === req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found" });
  }

  const participant = tournament.targetParticipants.find((p) => p.id === req.params.participantId);
  if (!participant) {
    return res.status(404).json({ error: "Participant not found" });
  }

  if (req.body.scores) {
    participant.scores = {
      ...participant.scores,
      ...req.body.scores
    };
  }

  if (req.body.rounds) {
    participant.rounds = req.body.rounds;
  }

  if (req.body.distanceAttempts) {
    participant.distanceAttempts = req.body.distanceAttempts;
  }

  if (req.body.specialOlympicsAttempts) {
    participant.specialOlympicsAttempts = req.body.specialOlympicsAttempts;
  }

  if (req.body.specialOlympicsLevel) {
    participant.specialOlympicsLevel = req.body.specialOlympicsLevel;
  }

  if (req.body.totalScore !== undefined) {
    participant.totalScore = req.body.totalScore;
  } else {
    participant.totalScore =
      (participant.scores.round1 || 0) +
      (participant.scores.round2 || 0) +
      (participant.scores.round3 || 0) +
      (participant.scores.round4 || 0);
  }

  saveDatabase(db);
  res.json(tournament);
});

// DELETE tournament
app.delete("/api/tournaments/:id", (req, res) => {
  const db = loadDatabase();
  const index = db.tournaments.findIndex((t: Tournament) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Tournament not found" });
  }

  db.tournaments.splice(index, 1);
  saveDatabase(db);
  res.json({ success: true, id: req.params.id });
});

// Start server
async function startServer() {
  // Vite dev server integrations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
