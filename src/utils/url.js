const { parse } = require("url");

// Reads and parses JSON body from request (returns Promise)
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Splits URL path into parts
function getPathParts(reqUrl) {
  const pathname = parse(reqUrl).pathname || "/";
  return pathname.replace(/^\/+|\/+$/g, "").split("/");
}

// Extracts query parameters from URL (returns an object)
function getQuery(reqUrl) {
  return parse(reqUrl, true).query || {};
}

module.exports = { parseJsonBody, getPathParts, getQuery };
