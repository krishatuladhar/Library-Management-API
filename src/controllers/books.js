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
const { validateBook } = require("../utils/validation");
const logger = require("../utils/logger");

// List books with optional filters, sorting, and pagination
async function listBooks(req, res) {
  try {
    const q = getQuery(req.url);
    const { page, limit, offset } = getPageParams(q);

    const filters = [];
    const params = [];

    // Apply filters based on query params
    if (q.title) {
      filters.push("b.title LIKE ?");
      params.push(`%${q.title}%`);
    }

    if (q.author) {
      filters.push("a.name LIKE ?");
      params.push(`%${q.author}%`);
    }

    if (q.year) {
      const y = Number(q.year);
      if (Number.isInteger(y)) {
        filters.push("b.published_year = ?");
        params.push(y);
      }
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // Sorting
    const sortable = new Set(["title", "published_year", "created_at"]);
    const sortField = sortable.has((q.sort || "").toLowerCase())
      ? q.sort
      : "created_at";
    const orderDir =
      (q.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    const sql = `
      SELECT b.id, b.title, b.isbn, b.published_year, b.author_id, b.created_at,
             a.name AS author_name, a.email AS author_email
      FROM books b
      JOIN authors a ON a.id = b.author_id
      ${where}
      ORDER BY b.${sortField} ${orderDir}
      LIMIT ? OFFSET ?;
    `;

    const totalSql = `SELECT COUNT(*) AS total FROM books b JOIN authors a ON a.id = b.author_id ${where};`;

    // Fetch books and total count
    const list = await allAsync(sql, [...params, limit, offset]);
    const total = (await getAsync(totalSql, params)).total;

    ok(res, list, { page, limit, total });
    logger.info(
      `Books listed: page=${page}, limit=${limit}, filter=${JSON.stringify(q)}`
    );
  } catch (err) {
    logger.error(`Failed to list books: ${err.message}`);
    serverError(res, err);
  }
}

// Create a new book
async function createBook(req, res) {
  try {
    const body = await parseJsonBody(req);

    // Check if book is valid
    const errors = validateBook(body);
    if (Object.keys(errors).length) {
      logger.error(
        `Validation failed while creating book: ${JSON.stringify(errors)}`
      );

      return badRequest(res, "Validation failed", errors);
    }

    // Check if author exists
    const author = await getAsync("SELECT id FROM authors WHERE id = ?", [
      body.author_id,
    ]);
    if (!author) {
      logger.error(`Invalid author_id: ${body.author_id}`);
      return badRequest(res, "author_id does not reference an existing author");
    }

    // Check for duplicate ISBN
    const dup = await getAsync("SELECT id FROM books WHERE isbn = ?", [
      body.isbn,
    ]);
    if (dup) {
      logger.error(`ISBN already exists: ${body.isbn}`);
      return conflict(res, "ISBN already exists.");
    }

    // Insert the new book
    const infoDB = await runAsync(
      "INSERT INTO books (title, isbn, published_year, author_id) VALUES (?, ?, ?, ?)",
      [
        body.title.trim(),
        body.isbn.trim(),
        body.published_year ?? null,
        body.author_id,
      ]
    );

    // Fetch the created book
    const book = await getAsync("SELECT * FROM books WHERE id = ?", [
      infoDB.lastID,
    ]);
    created(res, book);
    logger.info(`Book created: ${book.title} (ISBN: ${book.isbn})`);
  } catch (err) {
    if (err instanceof SyntaxError) {
      logger.error(`Invalid JSON body while creating book: ${err.message}`);
      return badRequest(res, "Invalid JSON body");
    }

    logger.error(`Failed to create book: ${err.message}`);
    serverError(res, err);
  }
}

// Update an existing book by ISBN
async function updateBookByISBN(req, res, isbn) {
  try {
    if (!isbn) {
      return badRequest(res, "ISBN is required");
    }

    // Fetch existing book
    const existingBook = await getAsync("SELECT * FROM books WHERE isbn = ?", [
      isbn,
    ]);
    if (!existingBook) {
      logger.error(`Book not found for update: ISBN=${isbn}`);
      return notFound(res, "Book not found");
    }

    const body = await parseJsonBody(req);
    const payload = {
      title: body.title ?? existingBook.title,
      isbn: body.isbn ?? existingBook.isbn,
      published_year: body.published_year ?? existingBook.published_year,
      author_id: body.author_id ?? existingBook.author_id,
    };

    // Validate updated book
    const errors = validateBook(payload);
    if (Object.keys(errors).length) {
      logger.error(
        `Validation failed while updating book: ${JSON.stringify(errors)}`
      );
      return badRequest(res, "Validation failed", errors);
    }

    // Check if new author_id exists
    if (payload.author_id !== existingBook.author_id) {
      const author = await getAsync("SELECT id FROM authors WHERE id = ?", [
        payload.author_id,
      ]);
      if (!author)
        return badRequest(
          res,
          "author_id does not reference an existing author"
        );
    }

    // Check for duplicate ISBN if changed
    if (payload.isbn !== existingBook.isbn) {
      const dup = await getAsync("SELECT id FROM books WHERE isbn = ?", [
        payload.isbn,
      ]);

      if (dup) {
        return conflict(res, "ISBN already exists.");
      }
    }

    // Update the book
    await runAsync(
      "UPDATE books SET title = ?, isbn = ?, published_year = ?, author_id = ? WHERE isbn = ?",
      [
        payload.title.trim(),
        payload.isbn.trim(),
        payload.published_year ?? null,
        payload.author_id,
        isbn,
      ]
    );

    // Fetch the updated book with author info
    const updatedBook = await getAsync(
      `
      SELECT b.*, a.name AS author_name, a.email AS author_email
      FROM books b
      JOIN authors a ON a.id = b.author_id
      WHERE b.isbn = ?;
    `,
      [payload.isbn]
    );

    ok(res, updatedBook);
    logger.info(
      `Book updated: ${updatedBook.title} (ISBN: ${updatedBook.isbn})`
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      logger.error(`Invalid JSON body while updating book: ${err.message}`);
      return badRequest(res, "Invalid JSON body");
    }

    logger.error(`Failed to update book ISBN=${isbn}: ${err.message}`);
    serverError(res, err);
  }
}

// Get a single book by ISBN
async function getBookByISBN(req, res, isbn) {
  try {
    if (!isbn) {
      return badRequest(res, "ISBN is required");
    }

    // Fetch book with author info
    const book = await getAsync(
      `
      SELECT b.*, a.name AS author_name, a.email AS author_email
      FROM books b
      JOIN authors a ON a.id = b.author_id
      WHERE b.isbn = ?;
    `,
      [isbn]
    );

    if (!book) {
      logger.error(`Book not found: ISBN=${isbn}`);
      return notFound(res, "Book not found");
    }

    ok(res, book);
    logger.info(`Fetched book: ${book.title} (ISBN: ${book.isbn})`);
  } catch (err) {
    logger.error(`Failed to fetch book ISBN=${isbn}: ${err.message}`);
    serverError(res, err);
  }
}

module.exports = { listBooks, createBook, updateBookByISBN, getBookByISBN };
