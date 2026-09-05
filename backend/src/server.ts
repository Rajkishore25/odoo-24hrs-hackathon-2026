import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 PeoplePay360 Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints mounted under http://localhost:${PORT}/api`);
});
