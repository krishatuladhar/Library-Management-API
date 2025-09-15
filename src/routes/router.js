const { getPathParts } = require("../utils/url");
const authors = require("../controllers/authors");
const books = require("../controllers/books");
const fs = require("fs");
const path = require("path");

// Load swagger.json once
const swaggerJson = fs.readFileSync(
  path.join(__dirname, "..", "swagger.json"),
  "utf8"
);

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

      // Serve Swagger UI and JSON
      if (resource === "docs") {
        if (!id) {
          res.setHeader("Content-Type", "text/html");

          // Simple Swagger UI HTML
          const swaggerUI = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Library API Docs</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.css" />
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js"></script>
              <script>
                window.onload = () => {
                  SwaggerUIBundle({
                    url: '/docs/swagger.json',
                    dom_id: '#swagger-ui',
                    presets: [
                      SwaggerUIBundle.presets.apis,
                      SwaggerUIBundle.SwaggerUIStandalonePreset
                    ],
                    layout: "BaseLayout"
                  });
                };
              </script>
            </body>
            </html>
          `;
          res.end(swaggerUI);
          return;
        }

        if (id === "swagger.json") {
          res.setHeader("Content-Type", "application/json");
          res.end(swaggerJson);
          return;
        }
      }

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
