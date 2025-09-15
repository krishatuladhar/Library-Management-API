const { getPathParts } = require("../utils/url");
const authors = require("../controllers/authors");
const books = require("../controllers/books");

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
  (async () => {
    try {
      const parts = getPathParts(req.url);
      const [resource, id] = parts;

      // Basic health check at root
      if (req.method === "GET" && resource === "") {
        return res.end(JSON.stringify({ status: "ok" }));
      }

      // Route handling for authors
      if (resource === "authors") {
        if (req.method === "GET" && !id) {
          return await authors.listAuthors(req, res);
        }

        if (req.method === "POST" && !id) {
          return await authors.createAuthor(req, res);
        }

        if (req.method === "GET" && id) {
          return await authors.getAuthorById(req, res, Number(id));
        }
      }

      // Route handling for books
      if (resource === "books") {
        if (req.method === "GET" && !id) {
          return await books.listBooks(req, res);
        }
        if (req.method === "POST" && !id) {
          return await books.createBook(req, res);
        }
        if (req.method === "PUT" && id) {
          return await books.updateBookByISBN(req, res, id);
        }
        if (req.method === "GET" && id) {
          return await books.getBookByISBN(req, res, id);
        }
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, message: "Not Found" }));
    } catch (err) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          success: false,
          message: "Internal Server Error",
          error: String(err),
        })
      );
    }
  })();
}

module.exports = router;
