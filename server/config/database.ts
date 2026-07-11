import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  // If already connected or connecting, do not open another connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongodbUri = process.env.MONGODB_URI || "";

  try {
    await mongoose.connect(mongodbUri);
    console.log('MongoDB conectado correctamente');
  } catch (error: any) {
    console.error('Error conectando a MongoDB:', error.message);
    // In production we throw to let the caller handle it, otherwise in development we fall back gracefully
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      throw error;
    }
  }
};

export default connectDB;
