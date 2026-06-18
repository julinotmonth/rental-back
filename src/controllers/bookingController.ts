import { Request, Response } from 'express'
import pool from '../config/database'

const generateNoBooking = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'BK'
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
  return result
}

const mapBooking = (row: any) => ({
  id: row.id,
  noBooking: row.no_booking,
  userId: row.user_id,
  namaUser: row.nama_user,
  emailUser: row.email_user,
  noHpUser: row.no_hp_user,
  consolId: row.console_id,
  namaConsol: row.nama_console,
  jumlahStick: row.jumlah_stick,
  tanggalBooking: row.tanggal_booking instanceof Date
    ? row.tanggal_booking.toISOString().split('T')[0]
    : String(row.tanggal_booking).split('T')[0],
  waktuMulai: typeof row.waktu_mulai === 'string' ? row.waktu_mulai.slice(0, 5) : row.waktu_mulai,
  durasi: row.durasi,
  totalBiaya: row.total_biaya,
  status: row.status,
  buktiPembayaran: row.bukti_pembayaran ?? undefined,
  createdAt: row.created_at instanceof Date
    ? row.created_at.toISOString().split('T')[0]
    : String(row.created_at).split('T')[0],
})

// GET /api/bookings          (admin: semua; user: milik sendiri)
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query
    const isAdmin = req.user!.role === 'admin'

    let query = 'SELECT * FROM bookings'
    const params: any[] = []
    const conditions: string[] = []

    if (!isAdmin) {
      conditions.push(`user_id = $${params.length + 1}`)
      params.push(req.user!.id)
    }
    if (status) {
      conditions.push(`status = $${params.length + 1}`)
      params.push(status)
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, params)
    res.json({ success: true, data: result.rows.map(mapBooking) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Gagal mengambil data booking' })
  }
}

// GET /api/bookings/:id
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Booking tidak ditemukan' })
      return
    }
    const booking = result.rows[0]
    if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Akses ditolak' })
      return
    }
    res.json({ success: true, data: mapBooking(booking) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil booking' })
  }
}

// POST /api/bookings
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      consolId, jumlahStick, tanggalBooking, waktuMulai, durasi,
      noHpUser, emailUser, buktiPembayaran
    } = req.body

    // Ambil data konsol
    const consolResult = await pool.query(
      'SELECT id, nama, harga_per_jam, status FROM consoles WHERE id = $1',
      [consolId]
    )
    if (consolResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Konsol tidak ditemukan' })
      return
    }
    const consol = consolResult.rows[0]
    if (consol.status !== 'tersedia') {
      res.status(400).json({ success: false, message: 'Konsol tidak tersedia saat ini' })
      return
    }

    const totalBiaya = consol.harga_per_jam * parseInt(durasi)

    // Generate no booking unik
    let noBooking = generateNoBooking()
    let attempt = 0
    while (attempt < 5) {
      const exists = await pool.query('SELECT id FROM bookings WHERE no_booking = $1', [noBooking])
      if (exists.rows.length === 0) break
      noBooking = generateNoBooking()
      attempt++
    }

    const result = await pool.query(
      `INSERT INTO bookings
        (no_booking, user_id, nama_user, email_user, no_hp_user, console_id, nama_console,
         jumlah_stick, tanggal_booking, waktu_mulai, durasi, total_biaya, status, bukti_pembayaran)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13)
       RETURNING *`,
      [
        noBooking,
        req.user!.id,
        req.user!.username,  // akan di-override pakai nama asli
        emailUser,
        noHpUser,
        consolId,
        consol.nama,
        jumlahStick,
        tanggalBooking,
        waktuMulai,
        durasi,
        totalBiaya,
        buktiPembayaran || null,
      ]
    )

    // Update nama_user dengan nama asli dari tabel users
    const userResult = await pool.query('SELECT nama FROM users WHERE id = $1', [req.user!.id])
    if (userResult.rows.length > 0) {
      await pool.query('UPDATE bookings SET nama_user = $1 WHERE id = $2', [userResult.rows[0].nama, result.rows[0].id])
      result.rows[0].nama_user = userResult.rows[0].nama
    }

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: mapBooking(result.rows[0])
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Gagal membuat booking' })
  }
}

// PATCH /api/bookings/:id/status  (admin)
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    const validStatus = ['pending', 'dikonfirmasi', 'selesai', 'dibatalkan']
    if (!validStatus.includes(status)) {
      res.status(400).json({ success: false, message: 'Status tidak valid' })
      return
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Booking tidak ditemukan' })
      return
    }
    res.json({ success: true, message: 'Status booking diperbarui', data: mapBooking(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status' })
  }
}

// PATCH /api/bookings/:id/bukti  (user — upload bukti pembayaran)
export const uploadBukti = async (req: Request, res: Response): Promise<void> => {
  try {
    const { buktiPembayaran } = req.body  // base64 data URL

    // Validasi kepemilikan
    const booking = await pool.query('SELECT user_id FROM bookings WHERE id = $1', [req.params.id])
    if (booking.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Booking tidak ditemukan' })
      return
    }
    if (req.user!.role !== 'admin' && booking.rows[0].user_id !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Akses ditolak' })
      return
    }

    const result = await pool.query(
      'UPDATE bookings SET bukti_pembayaran = $1 WHERE id = $2 RETURNING *',
      [buktiPembayaran, req.params.id]
    )
    res.json({ success: true, message: 'Bukti pembayaran berhasil diupload', data: mapBooking(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal upload bukti' })
  }
}

// GET /api/bookings/laporan/summary  (admin)
export const getLaporanSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await pool.query(`
      SELECT
        COUNT(*)                                        AS "totalTransaksi",
        COALESCE(SUM(total_biaya), 0)                  AS "totalPendapatan",
        ROUND(AVG(durasi)::numeric, 1)                 AS "rataRataDurasi"
      FROM bookings
      WHERE status != 'dibatalkan'
    `)

    const terlaris = await pool.query(`
      SELECT nama_console, COUNT(*) AS cnt
      FROM bookings WHERE status != 'dibatalkan'
      GROUP BY nama_console ORDER BY cnt DESC LIMIT 1
    `)

    // Pendapatan 7 hari terakhir
    const chart = await pool.query(`
      SELECT
        TO_CHAR(tanggal_booking, 'Dy') AS hari,
        COALESCE(SUM(total_biaya), 0)  AS pendapatan
      FROM bookings
      WHERE status != 'dibatalkan'
        AND tanggal_booking >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY tanggal_booking, TO_CHAR(tanggal_booking, 'Dy')
      ORDER BY tanggal_booking ASC
    `)

    const s = summary.rows[0]
    res.json({
      success: true,
      data: {
        totalTransaksi: parseInt(s.totalTransaksi),
        totalPendapatan: parseInt(s.totalPendapatan),
        rataRataDurasi: parseFloat(s.rataRataDurasi) || 0,
        consolTerlaris: terlaris.rows[0]?.nama_console || '—',
        pendapatanChart: chart.rows.map(r => ({
          hari: r.hari,
          pendapatan: parseInt(r.pendapatan),
        })),
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Gagal mengambil laporan' })
  }
}

// GET /api/bookings/dashboard/stats  (admin)
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const todayStats = await pool.query(
      `SELECT COUNT(*) AS "todayCount", COALESCE(SUM(total_biaya),0) AS "todayRevenue"
       FROM bookings WHERE tanggal_booking = $1 AND status != 'dibatalkan'`,
      [today]
    )

    const consolStats = await pool.query(`
      SELECT nama_console, COUNT(*) AS cnt
      FROM bookings WHERE status != 'dibatalkan'
      GROUP BY nama_console ORDER BY cnt DESC LIMIT 1
    `)

    const availConsoles = await pool.query(
      `SELECT COUNT(*) AS tersedia,
              (SELECT COUNT(*) FROM consoles) AS total
       FROM consoles WHERE status = 'tersedia'`
    )

    const recentBookings = await pool.query(
      `SELECT * FROM bookings ORDER BY created_at DESC LIMIT 8`
    )

    const chartData = await pool.query(`
      WITH days AS (
        SELECT generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day'::interval)::date AS day
      )
      SELECT
        TO_CHAR(d.day, 'Dy') AS hari,
        COALESCE(SUM(b.total_biaya), 0) AS pendapatan
      FROM days d
      LEFT JOIN bookings b ON b.tanggal_booking = d.day AND b.status != 'dibatalkan'
      GROUP BY d.day, TO_CHAR(d.day, 'Dy')
      ORDER BY d.day ASC
    `)

    const statusCount = await pool.query(`
      SELECT status, COUNT(*) AS cnt FROM bookings GROUP BY status
    `)

    const t = todayStats.rows[0]
    const a = availConsoles.rows[0]

    res.json({
      success: true,
      data: {
        todayCount: parseInt(t.todayCount),
        todayRevenue: parseInt(t.todayRevenue),
        consolTerlaris: consolStats.rows[0]?.nama_console || '—',
        consolTerlarisCount: parseInt(consolStats.rows[0]?.cnt || '0'),
        availConsoles: parseInt(a.tersedia),
        totalConsoles: parseInt(a.total),
        recentBookings: recentBookings.rows.map(mapBooking),
        pendapatanChart: chartData.rows.map(r => ({
          hari: r.hari,
          pendapatan: parseInt(r.pendapatan),
        })),
        statusCount: statusCount.rows.reduce((acc: any, r) => {
          acc[r.status] = parseInt(r.cnt); return acc
        }, {}),
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' })
  }
}
