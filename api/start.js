const crypto = require("crypto");
const { sign, json } = require("./_lib");

// GET /api/start -> { token } (one signed, single-use token per run)
module.exports = (req, res) => {
  const payload = Date.now() + "." + crypto.randomBytes(8).toString("hex");
  json(res, 200, { token: payload + "." + sign(payload) });
};
