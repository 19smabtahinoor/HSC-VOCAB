import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import pg from "pg";

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_OoVwi2Fr9qjJ@ep-jolly-sky-aop2lekk-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    pool = new pg.Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

async function initDb() {
  console.log("Checking and initializing Neon Database tables...");
  let client;
  try {
    client = await getPool().connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS hsc_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        liked BOOLEAN DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Neon database hsc_users table initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // Trigger DB migration schema check
  await initDb();

  // API: Get overall live likes count
  app.get("/api/likes/stats", async (req, res) => {
    try {
      const dbPool = getPool();
      const result = await dbPool.query("SELECT COUNT(*) FROM hsc_users WHERE liked = true");
      const totalLikes = (parseInt(result.rows[0].count, 10) || 0) + 97;
      res.json({ success: true, totalLikes });
    } catch (err: any) {
      console.error("Error in /api/likes/stats:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Get user profile details (to avoid outdated localStorage liked status)
  app.get("/api/users/profile", async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }
    try {
      const dbPool = getPool();
      const result = await dbPool.query("SELECT name, email, liked FROM hsc_users WHERE email = $1", [String(email).trim().toLowerCase()]);
      if (result.rows.length > 0) {
        res.json({ success: true, user: result.rows[0] });
      } else {
        res.json({ success: false, error: "User not found" });
      }
    } catch (err: any) {
      console.error("Error in /api/users/profile:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Register name & email
  app.post("/api/users/register", async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email || !name.trim() || !email.trim()) {
      return res.status(400).json({ success: false, error: "Name and Email are required fields." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address structure (e.g. name@example.com)." });
    }

    try {
      const dbPool = getPool();
      const result = await dbPool.query(
        `INSERT INTO hsc_users (name, email)
         VALUES ($1, $2)
         ON CONFLICT (email) 
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name, email, liked`,
        [name.trim(), email.trim().toLowerCase()]
      );

      res.json({
        success: true,
        user: result.rows[0]
      });
    } catch (err: any) {
      console.error("Error in /api/users/register:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Track liked feedback
  app.post("/api/users/like", async (req, res) => {
    const { email, liked } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Email is required to log user likes." });
    }

    try {
      const dbPool = getPool();
      await dbPool.query(
        "UPDATE hsc_users SET liked = $1 WHERE email = $2",
        [liked === true, email.trim().toLowerCase()]
      );

      // Fetch new count of total likes
      const statsResult = await dbPool.query("SELECT COUNT(*) FROM hsc_users WHERE liked = true");
      const totalLikes = (parseInt(statsResult.rows[0].count, 10) || 0) + 97;

      res.json({
        success: true,
        liked: liked === true,
        totalLikes
      });
    } catch (err: any) {
      console.error("Error in /api/users/like:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware setup for development/production routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://0.0.0.0:${PORT}`);
  });
}

startServer();
