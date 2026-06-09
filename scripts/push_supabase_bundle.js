const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SUPABASE_DIR = path.join(ROOT, "database", "supabase");
const SCHEMA_PATH = path.join(SUPABASE_DIR, "schema.sql");
const SEED_PATH = path.join(SUPABASE_DIR, "seed.sql");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const API_BASE = "https://api.supabase.com/v1";

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF");
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

function readSql(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function splitSqlStatements(sql) {
  const lines = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"));
  const joined = lines.join("\n");
  return joined
    .split(/;\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.endsWith(";") ? part : `${part};`);
}

async function runQuery(query, readOnly = false) {
  const response = await fetch(`${API_BASE}/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      read_only: readOnly
    })
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(`Supabase API ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function runBatch(label, statements) {
  console.log(`\n== ${label}: ${statements.length} statements ==`);
  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    process.stdout.write(`[${index + 1}/${statements.length}] `);
    await runQuery(statement, false);
    console.log("ok");
  }
}

async function main() {
  const schemaSql = readSql(SCHEMA_PATH);
  const seedSql = readSql(SEED_PATH);
  const schemaStatements = splitSqlStatements(schemaSql);
  const seedStatements = splitSqlStatements(seedSql);

  await runBatch("schema", schemaStatements);
  await runBatch("seed", seedStatements);
  console.log("\nSupabase upload complete.");
}

main().catch((error) => {
  console.error("\nUpload failed.");
  console.error(error.message || error);
  if (error.data) {
    console.error(JSON.stringify(error.data, null, 2));
  }
  process.exit(1);
});
