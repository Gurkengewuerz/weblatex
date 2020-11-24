const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const DB_PATH = process.env.DB_PATH || "db.json";
const adapter = new FileSync(
  path.isAbsolute(DB_PATH) ? DB_PATH : path.join(__dirname, "..", DB_PATH)
);
const db = low(adapter).defaults({ project: [], user: [] });

module.exports = db;
