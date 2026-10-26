const { redis, json, KEY } = require("./_lib");

// GET /api/health -> step-by-step database check (shows variable NAMES only, never values)
module.exports = async (req, res) => {
  const out = {
    envVarNamesFound: Object.keys(process.env).filter((k) =>
      /REST|KV_|UPSTASH|REDIS/i.test(k)
    ),
  };
  try {
    out.ping = await redis(["PING"]);
    await redis(["SET", "naga:health", "ok", "EX", 60]);
    out.writeAndRead = await redis(["GET", "naga:health"]);
    out.runnersOnBoard = await redis(["ZCARD", KEY]);
    out.ok = true;
  } catch (e) {
    out.ok = false;
    out.reason = String(e.message || e).slice(0, 160);
  }
  json(res, out.ok ? 200 : 503, out);
};
