import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map(e => ({ field: (e as any).path, message: e.msg }))
    })
    return
  }
  next()
}

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} tidak ditemukan` })
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error('❌ Error:', err.message)
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', detail: err.message })
}
