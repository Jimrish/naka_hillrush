// Shared helpers for the leaderboard API (Vercel serverless functions).
// Database: Upstash Redis through its REST API. Vercel's Upstash integration
// adds KV_REST_API_URL and KV_REST_API_TOKEN to your project automatically.
const crypto = require("crypto");

// Vercel's Upstash integration may name its variables KV_REST_API_URL / KV_REST_API_TOKEN,
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, or add a custom prefix. Accept all of them.
const findEnv = (re) => {
  const k = Object.keys(process.env).find((k) => re.test(k) && process.env[k]);
  return k ? process.env[k] : undefined;
};
const DB_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  findEnv(/REST_API_URL$|REST_URL$/);
const DB_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  findEnv(/REST_API_TOKEN$|REST_TOKEN$/);
const KEY = "naga:leaderboard";

async function redis(cmd) {
  if (!DB_URL || !DB_TOKEN)
    throw new Error(
      "Database is not connected: add Upstash Redis in Vercel Storage, then redeploy"
    );
  const r = await fetch(DB_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + DB_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const secret = () => process.env.LB_SECRET || DB_TOKEN || "dev-secret";
const sign = (s) =>
  crypto.createHmac("sha256", secret()).update(s).digest("hex").slice(0, 32);

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

async function top(n = 10) {
  const r = await redis(["ZREVRANGE", KEY, 0, n - 1, "WITHSCORES"]);
  const out = [];
  for (let i = 0; i < r.length; i += 2)
    out.push({ handle: r[i], score: Math.round(+r[i + 1]) });
  return out;
}

module.exports = { redis, sign, json, top, KEY };
