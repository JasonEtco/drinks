// Load environment variables in development
if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { database } from "../lib/database.js";
import { recipesRouter } from "./recipes.js";
import { chatRouter } from "./chat.js";
import { inventoryRouter } from "./inventory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("combined"));
app.use(express.json());

app.use("/api/recipes", recipesRouter());
app.use("/api/chat", chatRouter());
app.use("/api/inventory", inventoryRouter());

// Health check endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const recipesCount = await database.getRecipeCount();
    const inventoryCount = await database.getInventoryCount();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      recipesCount,
      inventoryCount,
    });
  } catch (error) {
    console.error("Error getting counts:", error);
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      recipesCount: 0,
      inventoryCount: 0,
    });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, "../../dist")));
app.use(express.static(path.join(__dirname, "../../public")));

// Catch-all handler: send back React's index.html file for client-side routing
app.get("*splat", (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🍸 Drinks server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend served at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Graceful shutdown...");
  database.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM. Graceful shutdown...");
  database.close();
  process.exit(0);
});
