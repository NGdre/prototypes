import { greet } from "@monorepo/shared";
import http from "http";

const server = http.createServer(async (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(await greet("Workspace user"));
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
