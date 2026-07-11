import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnecting = false;
let lastAttemptTime = 0;
const RETRY_COOLDOWN_MS = 30000; // 30 seconds cooldown for retrying if connection failed

const connectDB = async () => {
  // If already connected or connecting, do not open another connection
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  // Prevent spamming connection attempts on every request in development if it is failing
  const now = Date.now();
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    if (now - lastAttemptTime < RETRY_COOLDOWN_MS) {
      return;
    }
  }

  if (isConnecting) return;
  isConnecting = true;
  lastAttemptTime = now;

  let mongodbUri = process.env.MONGODB_URI;
  if (mongodbUri) {
    mongodbUri = mongodbUri.trim();
  }

  // Check if URI is valid and starts with the expected scheme
  const isValidUri = mongodbUri && (mongodbUri.startsWith("mongodb://") || mongodbUri.startsWith("mongodb+srv://"));

  if (!isValidUri) {
    isConnecting = false;
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error('La variable de entorno MONGODB_URI no está configurada o tiene un formato incorrecto (debe comenzar con "mongodb://" o "mongodb+srv://"). Por favor confígurala en Vercel o en tus variables de entorno.');
    }
    // In local development, if no URI is provided, run gracefully in offline/fallback mode without attempting localhost connection
    return;
  }

  try {
    // Add a connection timeout to avoid blocking requests indefinitely in case of network issues
    await mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 3000, // 3 seconds timeout
    });
    console.log('MongoDB conectado correctamente');
  } catch (error: any) {
    console.error('Error conectando a MongoDB:', error.message);
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      isConnecting = false;
      throw error;
    }
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
