const http = require("http");
const router = require("./routes/router");

const PORT = process.env.PORT || 3000;

const server = http.createServer(router);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
