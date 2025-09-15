const { expect } = require("chai");
const { listAuthors, getAuthorById } = require("../src/controllers/authors");

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
describe("Authors Controller (Test DB)", () => {
  it("should list all authors with pagination", async () => {
    const req = { url: "/authors?page=1&limit=10" };
    const res = mockRes();

    await listAuthors(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.data).to.be.an("array").with.length.greaterThan(0);
    expect(res.body.data[0]).to.have.property("name");
  });

  it("should return author with books", async () => {
    const req = { url: "/authors/1" };
    const res = mockRes();

    await getAuthorById(req, res, 1);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.data).to.have.property("name");
    expect(res.body.data).to.have.property("books");
    expect(res.body.data.books).to.be.an("array");
  });

  it("should return 404 if author not found", async () => {
    const req = { url: "/authors/999" };
    const res = mockRes();

    await getAuthorById(req, res, 999);

    expect(res.statusCode).to.equal(404);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal("Author not found");
  });
});
