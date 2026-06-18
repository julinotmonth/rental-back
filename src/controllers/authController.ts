import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database'

const signToken = (id: string, username: string, role: string) =>
  jwt.sign({ id, username, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions)

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, username, email, noHp, password } = req.body

    const exists = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )
    if (exists.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Username atau email sudah digunakan' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (nama, username, email, no_hp, password, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING id, nama, username, email, no_hp AS "noHp", role, created_at AS "createdAt"`,
      [nama, username, email, noHp, hashed]
    )

    const user = result.rows[0]
    const token = signToken(user.id, user.username, user.role)

    res.status(201).json({ success: true, message: 'Registrasi berhasil', data: { user, token } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Registrasi gagal' })
  }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body

    const result = await pool.query(
      `SELECT id, nama, username, email, no_hp AS "noHp", password, role, created_at AS "createdAt"
       FROM users
       WHERE username = $1 OR email = $1`,
      [usernameOrEmail]
    )

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Username atau password salah' })
      return
    }

    const user = result.rows[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Username atau password salah' })
      return
    }

    const { password: _pw, ...safeUser } = user
    const token = signToken(safeUser.id, safeUser.username, safeUser.role)

    res.json({ success: true, message: 'Login berhasil', data: { user: safeUser, token } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Login gagal' })
  }
}

// GET /api/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, nama, username, email, no_hp AS "noHp", role, created_at AS "createdAt"
       FROM users WHERE id = $1`,
      [req.user!.id]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' })
      return
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data user' })
  }
}