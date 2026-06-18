import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'

import authRoutes    from './routes/authRoutes'
import consolRoutes  from './routes/consolRoutes'
import bookingRoutes from './routes/bookingRoutes'
import { notFound, errorHandler } from './middleware/errorHandler'

dotenv.config()

const app  = express()
const PORT = parseInt(process.env.PORT || '5000')

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Limit JSON body size to 10 MB — cukup untuk base64 image bukti pembayaran
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static file uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'PS Rental Pro API is running 🎮', timestamp: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/consoles', consolRoutes)
app.use('/api/bookings', bookingRoutes)

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎮 PS Rental Pro API`)
  console.log(`📡 Server berjalan di http://localhost:${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`)
})

export default app