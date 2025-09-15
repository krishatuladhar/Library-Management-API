const { runAsync, getAsync, allAsync } = require("../config/db");
const {
  ok,
  created,
  badRequest,
  notFound,
  conflict,
  serverError,
} = require("../utils/responses");
const { parseJsonBody, getQuery } = require("../utils/url");
const { getPageParams } = require("../utils/pagination");
const { validateAuthor } = require("../utils/validation");
const logger = require("../utils/logger");

// Create a new author
async function createAuthor(req, res) {
  try {
    const body = await parseJsonBody(req);

    // Check if author is valid
    const errors = validateAuthor(body);
    if (Object.keys(errors).length) {
      logger.error(
        `Validation failed for creating author: ${JSON.stringify(errors)}`
      );
      return badRequest(res, "Validation failed", errors);
    }

    // Check if email already exists
    const exists = await getAsync("SELECT id FROM authors WHERE email = ?", [
      body.email,
    ]);
    if (exists) {
      logger.error(`Email already exists: ${body.email}`);
      return conflict(res, "Email already exists.");
    }

    // Insert author into database
    const infoDB = await runAsync(
      "INSERT INTO authors (name, email) VALUES (?, ?)",
      [body.name.trim(), body.email.trim()]
    );

    // Fetch the created author
    const author = await getAsync(
      "SELECT id, name, email, created_at FROM authors WHERE id = ?",
      [infoDB.lastID]
    );
    created(res, author);

    logger.info(`Author created: ${author.name} (ID: ${author.id})`);
  } catch (err) {
    if (err instanceof SyntaxError) {
      logger.error(`Invalid JSON body while creating author: ${err.message}`);
      return badRequest(res, "Invalid JSON body");
    }
    logger.error(`Failed to create author: ${err.message}`, {
      stack: err.stack,
    });
    serverError(res, err);
  }
}

// List authors with optional filtering, sorting, and pagination
async function listAuthors(req, res) {
  try {
    const q = getQuery(req.url);
    const { page, limit, offset } = getPageParams(q);

    const nameFilter = q.name ? `%${q.name}%` : null;
    const orderDir =
      (q.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const params = nameFilter ? [nameFilter, limit, offset] : [limit, offset];

    // SQL to fetch authors with book counts
    const listSql = `
      SELECT a.id, a.name, a.email, a.created_at, COUNT(b.id) AS book_count
      FROM authors a
      LEFT JOIN books b ON b.author_id = a.id
      ${nameFilter ? "WHERE a.name LIKE ?" : ""}
      GROUP BY a.id
      ORDER BY book_count ${orderDir}, a.id ASC
      LIMIT ? OFFSET ?;
    `;

    const totalSql = `SELECT COUNT(*) AS total FROM authors ${
      nameFilter ? "WHERE name LIKE ?" : ""
    };`;

    const list = await allAsync(listSql, params);
    const total = nameFilter
      ? (await getAsync(totalSql, [nameFilter])).total
      : (await getAsync(totalSql)).total;

    ok(res, list, { page, limit, total });
    logger.info(
      `Authors listed: page=${page}, limit=${limit}, filter=${q.name || "none"}`
    );
  } catch (err) {
    logger.error(`Failed to list authors: ${err.message}`, {
      stack: err.stack,
    });
    serverError(res, err);
  }
}

// Get author by ID including their books
async function getAuthorById(req, res, id) {
  try {
    const author = await getAsync(
      "SELECT id, name, email, created_at FROM authors WHERE id = ?",
      [id]
    );

    // Return 404 if author not found
    if (!author) {
      logger.warn(`Author not found: ID=${id}`);
      return notFound(res, "Author not found");
    }

    const books = await allAsync(
      "SELECT id, title, isbn, published_year, author_id, created_at FROM books WHERE author_id = ?",
      [id]
    );

    ok(res, { ...author, books });
    logger.info(
      `Fetched author: ${author.name} (ID: ${author.id}) with ${books.length} books`
    );
  } catch (err) {
    logger.error(`Failed to fetch author ID=${id}: ${err.message}`, {
      stack: err.stack,
    });
    serverError(res, err);
  }
}

module.exports = { listAuthors, createAuthor, getAuthorById };
