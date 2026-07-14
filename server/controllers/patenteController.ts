import { Request, Response } from 'express';
import { Patente } from '../models';

export const getPatentes = async (req: Request, res: Response) => {
  try {
    const records = await Patente.find({ userId: req.params.userId }).sort({ fechaPago: -1 });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPatente = async (req: Request, res: Response) => {
  try {
    const record = await Patente.create(req.body);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePatente = async (req: Request, res: Response) => {
  try {
    const actualizado = await Patente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(actualizado);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePatente = async (req: Request, res: Response) => {
  try {
    await Patente.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
