import { type ApiResponse, greet } from "@monorepo/shared";
import express from "express";

const app = express();
const port = process.env.PORT || 4000;

app.get("/api/hello", async (_, res) => {
  const msg = await greet("Workspace user");

  const response: ApiResponse<string> = {
    success: true,
    data: msg,
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
