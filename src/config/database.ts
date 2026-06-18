import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ps_rental_pro',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

pool.on('connect', () => {
  console.log('✅ Terhubung ke PostgreSQL')
})

pool.on('error', (err) => {
  console.error('❌ Error koneksi PostgreSQL:', err)
  process.exit(-1)
})

export default pool
