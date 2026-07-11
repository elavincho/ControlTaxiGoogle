import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { User, Viaje, GastoCombustible, Mantenimiento, Alerta } from './models';
import apiRouter from './routes';
import connectDB from './config/database';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS middleware for all routes
app.use(cors());
app.use(express.json());

// Ensure Database is connected for each request (crucial for Serverless Vercel warm starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err: any) {
    console.error("Database connection middleware error:", err.message);
    next();
  }
});

// --- MOUNT API ROUTER ---
app.use('/api', apiRouter);

// Health Check & DB Status (Keep legacy for verification)
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({ 
    status: "ok", 
    mongodb: isConnected ? "connected" : "disconnected",
    database: (process.env.MONGODB_URI || "").includes("@") ? "Remote Atlas" : "Local/Fallback"
  });
});

// --- VITE MIDDLEWARE CONFIGURATION ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Express MVC server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
