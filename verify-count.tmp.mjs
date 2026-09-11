import Database from "better-sqlite3"
import { execSync } from "node:child_process"
const file = execSync("find .wrangler/state/v3/d1 -name '*.sqlite' ! -name 'metadata.sqlite'").toString().trim().split("\n")[0]
const db = new Database(file)
console.log("submissions rows:", db.prepare("select count(*) as n from submissions").get().n)
console.log("agent_runs rows:", db.prepare("select count(*) as n from agent_runs").get().n)
