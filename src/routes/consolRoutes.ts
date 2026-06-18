import { Router } from 'express'
import { body } from 'express-validator'
import {
  getConsoles, getConsoleById, createConsole, updateConsole, deleteConsole
} from '../controllers/consolController'
import { authenticate, authorizeAdmin } from '../middleware/auth'
import { validate } from '../middleware/errorHandler'

const router = Router()

// Public
router.get('/', getConsoles)
router.get('/:id', getConsoleById)

// Admin only
router.post('/',
  authenticate, authorizeAdmin,
  [
    body('nama').trim().notEmpty().withMessage('Nama konsol wajib diisi'),
    body('deskripsi').trim().notEmpty().withMessage('Deskripsi wajib diisi'),
    body('hargaPerJam').isInt({ min: 1000 }).withMessage('Harga per jam minimal Rp 1.000'),
    body('stok').isInt({ min: 1 }).withMessage('Stok minimal 1'),
    body('status').optional().isIn(['tersedia', 'maintenance']).withMessage('Status tidak valid'),
  ],
  validate,
  createConsole
)

router.put('/:id',
  authenticate, authorizeAdmin,
  [
    body('hargaPerJam').optional().isInt({ min: 1000 }).withMessage('Harga per jam minimal Rp 1.000'),
    body('stok').optional().isInt({ min: 0 }).withMessage('Stok tidak boleh negatif'),
    body('status').optional().isIn(['tersedia', 'maintenance']).withMessage('Status tidak valid'),
  ],
  validate,
  updateConsole
)

router.delete('/:id', authenticate, authorizeAdmin, deleteConsole)

export default router
