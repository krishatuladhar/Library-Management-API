// Simple regex for 10-digit ISBN
const ISBN10_REGEX = /^\d{10}$/;

// Simple email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validates author payload (name and email)
function validateAuthor(payload) {
  const errors = {};

  if (!payload.name || String(payload.name).trim().length < 2) {
    errors.name = "Name is required and must be at least 2 characters.";
  }

  if (!payload.email || !EMAIL_REGEX.test(String(payload.email))) {
    errors.email = "Email is required and must be a valid email.";
  }
  return errors;
}

// Validates book payload (title, isbn, published_year, author_id)
function validateBook(payload) {
  const errors = {};
  if (!payload.title || String(payload.title).trim().length < 1) {
    errors.title = "Title is required and must be at least 1 character.";
  }

  if (payload.published_year !== undefined && payload.published_year !== null) {
    const y = Number(payload.published_year);
    if (!Number.isInteger(y) || y < 0 || y > 9999) {
      errors.published_year = "Published Year must be a valid year.";
    }
  }

  if (!payload.isbn || !ISBN10_REGEX.test(String(payload.isbn))) {
    errors.isbn =
      "ISBN must be exactly 10 digits (no spaces, dashes, or letters).";
  }

  if (!payload.author_id) {
    errors.author_id = "author_id is required.";
  }
  return errors;
}

module.exports = { validateAuthor, validateBook };
