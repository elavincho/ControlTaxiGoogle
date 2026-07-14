import { Router } from 'express';
import { getPatentes, createPatente, updatePatente, deletePatente } from '../controllers/patenteController';

const router = Router();

router.get('/:userId', getPatentes);
router.post('/', createPatente);
router.put('/:id', updatePatente);
router.delete('/:id', deletePatente);

export default router;
