import { Router } from 'express'
import { body } from 'express-validator'
import { register, login, getMe } from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/errorHandler'

const router = Router()

router.post('/register',
  [
    body('nama').trim().isLength({ min: 2 }).withMessage('Nama minimal 2 karakter'),
    body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, underscore'),
    body('email').isEmail().withMessage('Format email tidak valid'),
    body('noHp').matches(/^[0-9]{10,13}$/).withMessage('Nomor HP tidak valid'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
  ],
  validate,
  register
)

router.post('/login',
  [
    body('usernameOrEmail').notEmpty().withMessage('Username atau email wajib diisi'),
    body('password').notEmpty().withMessage('Password wajib diisi'),
  ],
  validate,
  login
)

router.get('/me', authenticate, getMe)

export default router
