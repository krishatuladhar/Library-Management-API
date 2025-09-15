const { getPathParts } = require("../utils/url");

// Base router function to handle all incoming requests
function router(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  // Basic health check at root
  const parts = getPathParts(req.url);
  const [resource] = parts;

  if (req.method === "GET" && resource === "") {
    return res.end(JSON.stringify({ status: "ok" }));
  }

  // Placeholder for future route handling
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, message: "Not Found" }));
}

module.exports = router;
