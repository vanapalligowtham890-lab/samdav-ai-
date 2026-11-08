import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "vaani.db");
const db = new Database(dbPath);

// Enable WAL mode for concurrency and performance
db.pragma("journal_mode = WAL");

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT UNIQUE,
    duration_seconds REAL DEFAULT 0,
    language_code TEXT DEFAULT 'te-IN',
    status TEXT DEFAULT 'pending',
    transcript TEXT,
    detected_language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    customer_name TEXT,
    need TEXT,
    budget TEXT,
    objections TEXT, -- JSON array of strings
    urgency TEXT CHECK(urgency IN ('low', 'medium', 'high') OR urgency IS NULL),
    next_step TEXT,
    follow_up_date TEXT,
    key_quote TEXT,
    follow_up_message TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recaps (
    id TEXT PRIMARY KEY,
    recap_date TEXT NOT NULL,
    spoken_text_telugu TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    text_hash TEXT UNIQUE,
    voice TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tts_cache (
    text_hash TEXT PRIMARY KEY,
    voice TEXT NOT NULL,
    language TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Safe migrations for audio_url support across calls and leads
try {
  db.exec("ALTER TABLE calls ADD COLUMN audio_url TEXT;");
} catch (_) {}
try {
  db.exec("ALTER TABLE leads ADD COLUMN audio_url TEXT;");
} catch (_) {}

// Seed default settings if not exists
const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
`);
insertSetting.run("language", "te-IN");
insertSetting.run("voice", "Shivani"); // Timbre v3.0 default Telugu-capable voice
insertSetting.run("business_type", "Small Business (General / Healthcare / Coaching / Retail)");
insertSetting.run("demo_mode", "false");

export default db;
