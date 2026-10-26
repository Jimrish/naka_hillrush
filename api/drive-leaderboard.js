const { redis, json } = require("./_lib");
const KEY = "naka:drive:leaderboard";

// GET /api/drive-leaderboard -> { top: [{ handle, score }, ...] }
module.exports = async (req, res) => {
  try {
    const r = await redis(["ZREVRANGE", KEY, 0, 9, "WITHSCORES"]);
    const top = [];
    for (let i = 0; i < r.length; i += 2)
      top.push({ handle: r[i], score: Math.round(+r[i + 1]) });
    json(res, 200, { top });
  } catch (e) {
    json(res, 503, {
      error: "Leaderboard unavailable",
      reason: String(e.message || e).slice(0, 160),
    });
  }
};
