// Utility functions for sending HTTP responses
function ok(res, data, meta) {
  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, data, meta }));
}

function created(res, data) {
  res.statusCode = 201;
  res.end(JSON.stringify({ success: true, data }));
}

function badRequest(res, message, details) {
  res.statusCode = 400;
  res.end(JSON.stringify({ success: false, message, details }));
}

function notFound(res, message = "Not found") {
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, message }));
}

function conflict(res, message = "Conflict") {
  res.statusCode = 409;
  res.end(JSON.stringify({ success: false, message }));
}

function serverError(res, err) {
  res.statusCode = 500;
  res.end(
    JSON.stringify({
      success: false,
      message: "Internal Server Error",
      error: String(err),
    })
  );
}

module.exports = { ok, created, badRequest, notFound, conflict, serverError };
