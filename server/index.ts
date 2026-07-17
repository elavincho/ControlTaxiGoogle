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
  // Let health check pass through
  if (req.path === '/api/health') {
    return next();
  }

  const mongodbUri = process.env.MONGODB_URI;
  const hasUri = mongodbUri && (mongodbUri.trim().startsWith("mongodb://") || mongodbUri.trim().startsWith("mongodb+srv://"));

  if (!hasUri) {
    return res.status(500).json({ 
      error: 'La variable de entorno MONGODB_URI no está configurada. Por favor configúrala en el panel de configuración de AI Studio con tu cadena de conexión (ej. mongodb+srv://...) para poder guardar y sincronizar todos tus datos en MongoDB.' 
    });
  }

  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      throw new Error("La conexión de Mongoose no está activa (readyState: " + mongoose.connection.readyState + ")");
    }
    next();
  } catch (err: any) {
    console.error("Database connection middleware error:", err.message);
    return res.status(500).json({ 
      error: `Error de conexión con MongoDB: ${err.message}. Asegúrate de haber configurado correctamente tu cadena de conexión en MONGODB_URI y de haber habilitado el acceso desde cualquier dirección IP (0.0.0.0/0) en la sección Network Access de tu cluster de MongoDB Atlas.` 
    });
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
