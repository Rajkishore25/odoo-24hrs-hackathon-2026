import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5000;

// Server entrypoint - reloaded with active PostgreSQL credentials
app.listen(PORT, () => {
  console.log(`[PeoplePay360] Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints mounted under http://localhost:${PORT}/api`);
});
