import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Tournament } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure public/cache directory exists for sponsor images caching
const cacheDir = path.join(process.cwd(), "public", "cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Serve cached images directly
app.use("/cached-images", express.static(cacheDir));

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

// POST cache sponsor image
app.post("/api/tournaments/:id/cache-sponsor", async (req, res) => {
  const { imageUrl } = req.body;
  const { id } = req.params;

  if (!imageUrl) {
    return res.status(400).json({ error: "No imageUrl provided" });
  }

  try {
    let buffer: Buffer;
    let ext = "png";

    if (imageUrl.startsWith("data:")) {
      // Base64 URI
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 image data" });
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      buffer = Buffer.from(base64Data, "base64");

      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        ext = "jpg";
      } else if (mimeType.includes("svg")) {
        ext = "svg";
      } else if (mimeType.includes("webp")) {
        ext = "webp";
      } else if (mimeType.includes("gif")) {
        ext = "gif";
      }
    } else {
      // Remote URL - use native global fetch (Node 18+)
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        ext = "jpg";
      } else if (contentType.includes("svg")) {
        ext = "svg";
      } else if (contentType.includes("webp")) {
        ext = "webp";
      } else if (contentType.includes("gif")) {
        ext = "gif";
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }

    const cacheDir = path.join(process.cwd(), "public", "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const filename = `sponsor_${id}.${ext}`;
    const filePath = path.join(cacheDir, filename);
    fs.writeFileSync(filePath, buffer);

    const db = loadDatabase();
    const index = db.tournaments.findIndex((t: Tournament) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const cachedPath = `/cached-images/${filename}`;
    db.tournaments[index].sponsorImage = cachedPath;
    saveDatabase(db);

    res.json({
      success: true,
      cachedUrl: cachedPath,
      tournament: db.tournaments[index]
    });
  } catch (error: any) {
    console.error("Error caching sponsor image:", error);
    res.status(500).json({ error: `Image caching failed: ${error.message}` });
  }
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
    
    // Serve static files with custom headers
    // Hashed files in /assets can be cached aggressively
    // HTML files should never be cached so users get updates instantly after redeploy
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (filePath.includes("/assets/") || filePath.includes("\\assets\\")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));

    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
