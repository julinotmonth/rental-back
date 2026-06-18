import { Request, Response } from 'express'
import pool from '../config/database'

const mapConsole = (row: any) => ({
  id: row.id,
  nama: row.nama,
  deskripsi: row.deskripsi,
  hargaPerJam: row.harga_per_jam,
  stok: row.stok,
  status: row.status,
  gambar: row.gambar ?? undefined,
  createdAt: row.created_at,
})

// GET /api/consoles
export const getConsoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query
    let query = 'SELECT * FROM consoles'
    const params: string[] = []
    if (status) { query += ' WHERE status = $1'; params.push(status as string) }
    query += ' ORDER BY created_at ASC'

    const result = await pool.query(query, params)
    res.json({ success: true, data: result.rows.map(mapConsole) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data konsol' })
  }
}

// GET /api/consoles/:id
export const getConsoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM consoles WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Konsol tidak ditemukan' })
      return
    }
    res.json({ success: true, data: mapConsole(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil konsol' })
  }
}

// POST /api/consoles  (admin)
export const createConsole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, deskripsi, hargaPerJam, stok, status, gambar } = req.body
    const result = await pool.query(
      `INSERT INTO consoles (nama, deskripsi, harga_per_jam, stok, status, gambar)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nama, deskripsi, hargaPerJam, stok, status || 'tersedia', gambar || null]
    )
    res.status(201).json({ success: true, message: 'Konsol berhasil ditambahkan', data: mapConsole(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan konsol' })
  }
}

// PUT /api/consoles/:id  (admin)
export const updateConsole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, deskripsi, hargaPerJam, stok, status, gambar } = req.body
    const result = await pool.query(
      `UPDATE consoles
       SET nama          = COALESCE($1, nama),
           deskripsi     = COALESCE($2, deskripsi),
           harga_per_jam = COALESCE($3, harga_per_jam),
           stok          = COALESCE($4, stok),
           status        = COALESCE($5, status),
           gambar        = COALESCE($6, gambar)
       WHERE id = $7
       RETURNING *`,
      [nama, deskripsi, hargaPerJam, stok, status, gambar, req.params.id]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Konsol tidak ditemukan' })
      return
    }
    res.json({ success: true, message: 'Konsol berhasil diperbarui', data: mapConsole(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui konsol' })
  }
}

// DELETE /api/consoles/:id  (admin)
export const deleteConsole = async (req: Request, res: Response): Promise<void> => {
  try {
    // Cek apakah ada booking aktif
    const activeBooking = await pool.query(
      `SELECT id FROM bookings WHERE console_id = $1 AND status IN ('pending','dikonfirmasi')`,
      [req.params.id]
    )
    if (activeBooking.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Tidak dapat menghapus konsol yang masih memiliki booking aktif' })
      return
    }

    const result = await pool.query('DELETE FROM consoles WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Konsol tidak ditemukan' })
      return
    }
    res.json({ success: true, message: 'Konsol berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus konsol' })
  }
}
