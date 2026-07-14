import mongoose from 'mongoose';

const patenteSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fechaPago: { type: String, required: true },
  numeroCuota: { type: String, required: true },
  mes: { type: String, required: true },
  anio: { type: String, required: true },
  importe: { type: Number, required: true },
  fechaProximoVencimiento: { type: String, required: true }
}, { timestamps: true });

export const Patente = mongoose.model('Patente', patenteSchema);
