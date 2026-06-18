import { Router } from 'express'
import { body } from 'express-validator'
import {
  getBookings, getBookingById, createBooking,
  updateBookingStatus, uploadBukti,
  getLaporanSummary, getDashboardStats
} from '../controllers/bookingController'
import { authenticate, authorizeAdmin } from '../middleware/auth'
import { validate } from '../middleware/errorHandler'

const router = Router()

// Stats (admin)
router.get('/dashboard/stats', authenticate, authorizeAdmin, getDashboardStats)
router.get('/laporan/summary', authenticate, authorizeAdmin, getLaporanSummary)

// Bookings CRUD
router.get('/', authenticate, getBookings)
router.get('/:id', authenticate, getBookingById)

router.post('/',
  authenticate,
  [
    body('consolId').notEmpty().withMessage('Konsol wajib dipilih'),
    body('jumlahStick').isInt({ min: 1, max: 4 }).withMessage('Jumlah stick 1–4'),
    body('tanggalBooking').isDate().withMessage('Tanggal tidak valid'),
    body('waktuMulai').matches(/^\d{2}:\d{2}$/).withMessage('Waktu tidak valid'),
    body('durasi').isInt({ min: 1, max: 12 }).withMessage('Durasi 1–12 jam'),
    body('noHpUser').matches(/^[0-9]{10,13}$/).withMessage('Nomor HP tidak valid'),
    body('emailUser').isEmail().withMessage('Email tidak valid'),
  ],
  validate,
  createBooking
)

router.patch('/:id/status',
  authenticate, authorizeAdmin,
  [body('status').isIn(['pending','dikonfirmasi','selesai','dibatalkan']).withMessage('Status tidak valid')],
  validate,
  updateBookingStatus
)

router.patch('/:id/bukti',
  authenticate,
  [body('buktiPembayaran').notEmpty().withMessage('Data bukti tidak boleh kosong')],
  validate,
  uploadBukti
)

export default router
