import { Router } from 'express';
import authRoutes from './authRoutes';
import viajesRoutes from './viajesRoutes';
import combustibleRoutes from './combustibleRoutes';
import mantenimientoRoutes from './mantenimientoRoutes';
import alertasRoutes from './alertasRoutes';
import monotributoRoutes from './monotributoRoutes';
import seguroRoutes from './seguroRoutes';
import patenteRoutes from './patenteRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', authRoutes);
router.use('/viajes', viajesRoutes);
router.use('/combustible', combustibleRoutes);
router.use('/mantenimiento', mantenimientoRoutes);
router.use('/alertas', alertasRoutes);
router.use('/monotributo', monotributoRoutes);
router.use('/seguro', seguroRoutes);
router.use('/patente', patenteRoutes);

export default router;
