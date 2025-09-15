const { expect } = require("chai");
const { listBooks, getBookByISBN } = require("../src/controllers/books");

// Simulate Express.js req, res objects
function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };

  res.json = function (data) {
    this.body = data;
    return this;
  };

  res.end = function (data) {
    if (data) this.body = JSON.parse(data);
    return this;
  };
  return res;
}

// Test database pre-populated with known data
describe("Books Controller (Test DB)", () => {
  it("should list all books with pagination", async () => {
    const req = { url: "/books?page=1&limit=10" };
    const res = mockRes();

    await listBooks(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.data).to.be.an("array").with.length.greaterThan(0);
    expect(res.body.data[0]).to.have.property("title");
  });

  it("should fetch a book by ISBN", async () => {
    const req = { url: "/books/1234567890" };
    const res = mockRes();

    await getBookByISBN(req, res, "1234567890");

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.data).to.have.property("title");
  });

  it("should return 404 if book not found", async () => {
    const req = { url: "/books/999" };
    const res = mockRes();

    await getBookByISBN(req, res, "999");

    expect(res.statusCode).to.equal(404);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal("Book not found");
  });
});
