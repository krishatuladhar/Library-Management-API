const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const isTest = process.env.NODE_ENV === "test";

/**
 * Define the database file path.
 * - Main DB: data/library.sqlite
 * - Test DB: data/library.test.sqlite
 */
const DB_PATH = isTest
  ? process.env.TEST_DB_PATH ||
    path.join(process.cwd(), "data", "library.test.sqlite")
  : process.env.DB_PATH || path.join(process.cwd(), "data", "library.sqlite");

// Ensure the folder exists (If not, create it)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Open SQLite connection
const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("Failed to open DB", err);
    } else {
      console.log(
        `Connected to ${isTest ? "Test" : "Main"} SQLite database at ${DB_PATH}`
      );
    }
  }
);

// Enable foreign keys and write-ahead logging mode
db.run("PRAGMA foreign_keys = ON");
db.run("PRAGMA journal_mode = WAL;");

// Queue for write operations
const writeQueue = [];

function processQueue() {
  if (writeQueue.length === 0) {
    return;
  }

  const { sql, params, resolve, reject } = writeQueue.shift();
  db.run(sql, params, function (err) {
    if (err) {
      reject(err);
    } else {
      resolve({ lastID: this.lastID, changes: this.changes });
    }

    processQueue();
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    writeQueue.push({ sql, params, resolve, reject });
    if (writeQueue.length === 1) {
      processQueue();
    }
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }

      resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }

      resolve(rows);
    });
  });
}

// Run SQL statements from a file (useful for migration and seeding)
function runFile(filepath) {
  if (!fs.existsSync(filepath)) {
    console.warn(`SQL file not found: ${filepath}`);
    return Promise.resolve();
  }

  const sql = fs.readFileSync(filepath, "utf8");
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

// Migration file to initialize the database schema
async function migrate() {
  const p = path.join(__dirname, "..", "migrations", "001_init.sql");
  await runFile(p);
  console.log("Migration complete.");
}

// Seed file to populate initial data
async function seed() {
  const p = path.join(
    __dirname,
    "..",
    "seed",
    isTest ? "seed.test.sql" : "seed.sql"
  );
  await runFile(p);
  console.log("Seed complete.");
}

// If this file is run directly, execute migrate or seed based on command line argument
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === "migrate") {
    migrate();
  } else if (cmd === "seed") {
    seed();
  } else {
    console.log("Run: node db.js migrate  OR  node db.js seed");
  }
}

module.exports = { db, runAsync, getAsync, allAsync };
