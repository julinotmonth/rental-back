import pool from './database'
import bcrypt from 'bcryptjs'

const seed = async () => {
  const client = await pool.connect()
  try {
    console.log('🌱 Menjalankan seed data...')

    // ── USERS ──────────────────────────────────────────────────────────────
    const hashUser  = await bcrypt.hash('user123', 10)
    const hashSari  = await bcrypt.hash('sari123', 10)
    const hashAdmin = await bcrypt.hash('admin123', 10)

    await client.query(`
      INSERT INTO users (id, nama, username, email, no_hp, password, role, created_at)
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'Budi Santoso',   'user1', 'budi@gmail.com',         '08111111111', $1, 'user',  '2024-11-01'),
        ('00000000-0000-0000-0000-000000000002', 'Sari Dewi',      'sari',  'sari@gmail.com',         '08222222222', $2, 'user',  '2024-11-05'),
        ('00000000-0000-0000-0000-000000000003', 'Admin PS Rental','admin', 'admin@psrentalpro.id',   '08000000000', $3, 'admin', '2024-01-01')
      ON CONFLICT (username) DO NOTHING;
    `, [hashUser, hashSari, hashAdmin])

    // ── CONSOLES ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO consoles (id, nama, deskripsi, harga_per_jam, stok, status)
      VALUES
        ('10000000-0000-0000-0000-000000000001', 'PlayStation 4',          'Konsol gaming PS4 standar dengan library game yang luas.',            15000, 3, 'tersedia'),
        ('10000000-0000-0000-0000-000000000002', 'PlayStation 4 Pro',      'PS4 Pro dengan performa grafis 4K dan HDR yang memukau.',              20000, 2, 'tersedia'),
        ('10000000-0000-0000-0000-000000000003', 'PlayStation 5',          'Konsol next-gen PS5 dengan SSD ultra-cepat dan DualSense.',            30000, 2, 'tersedia'),
        ('10000000-0000-0000-0000-000000000004', 'PlayStation 5 Digital',  'PS5 Digital Edition tanpa disc drive, harga lebih terjangkau.',        25000, 1, 'maintenance')
      ON CONFLICT (id) DO NOTHING;
    `)

    // ── BOOKINGS ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO bookings (id, no_booking, user_id, nama_user, email_user, no_hp_user, console_id, nama_console, jumlah_stick, tanggal_booking, waktu_mulai, durasi, total_biaya, status, created_at)
      VALUES
        ('20000000-0000-0000-0000-000000000001','BKGP72W000','00000000-0000-0000-0000-000000000001','Budi Santoso','budi@gmail.com','08111111111','10000000-0000-0000-0000-000000000001','PlayStation 4',    2,'2026-06-16','10:00',2, 30000, 'selesai',     '2026-06-16'),
        ('20000000-0000-0000-0000-000000000002','BKA1B2C3D4','00000000-0000-0000-0000-000000000001','Budi Santoso','budi@gmail.com','08111111111','10000000-0000-0000-0000-000000000001','PlayStation 4',    2,'2024-12-10','14:00',3, 45000, 'selesai',     '2024-12-10'),
        ('20000000-0000-0000-0000-000000000003','BKE5F6G7H8','00000000-0000-0000-0000-000000000001','Budi Santoso','budi@gmail.com','08111111111','10000000-0000-0000-0000-000000000003','PlayStation 5',    2,'2024-12-12','10:00',2, 60000, 'dikonfirmasi','2024-12-12'),
        ('20000000-0000-0000-0000-000000000004','BKI9J0K1L2','00000000-0000-0000-0000-000000000001','Budi Santoso','budi@gmail.com','08111111111','10000000-0000-0000-0000-000000000002','PlayStation 4 Pro',1,'2024-12-15','16:00',4, 80000, 'pending',     '2024-12-15'),
        ('20000000-0000-0000-0000-000000000005','BKM3N4O5P6','00000000-0000-0000-0000-000000000002','Sari Dewi',  'sari@gmail.com','08222222222','10000000-0000-0000-0000-000000000003','PlayStation 5',    2,'2024-12-13','18:00',3, 90000, 'selesai',     '2024-12-13'),
        ('20000000-0000-0000-0000-000000000006','BKQ7R8S9T0','00000000-0000-0000-0000-000000000002','Sari Dewi',  'sari@gmail.com','08222222222','10000000-0000-0000-0000-000000000001','PlayStation 4',    2,'2024-12-14','12:00',2, 30000, 'dibatalkan',  '2024-12-14'),
        ('20000000-0000-0000-0000-000000000007','BKU1V2W3X4','00000000-0000-0000-0000-000000000001','Budi Santoso','budi@gmail.com','08111111111','10000000-0000-0000-0000-000000000003','PlayStation 5',    2,'2024-12-16','09:00',5,150000, 'selesai',     '2024-12-16'),
        ('20000000-0000-0000-0000-000000000008','BKY5Z6A7B8','00000000-0000-0000-0000-000000000002','Sari Dewi',  'sari@gmail.com','08222222222','10000000-0000-0000-0000-000000000002','PlayStation 4 Pro',1,'2024-12-17','13:00',3, 60000, 'dikonfirmasi','2024-12-17'),
        ('20000000-0000-0000-0000-000000000009','BKC9D0E1F2','00000000-0000-0000-0000-000000000001','Budi Santoso','budi@gmail.com','08111111111','10000000-0000-0000-0000-000000000001','PlayStation 4',    2,'2024-12-18','11:00',2, 30000, 'selesai',     '2024-12-18'),
        ('20000000-0000-0000-0000-000000000010','BKG3H4I5J6','00000000-0000-0000-0000-000000000002','Sari Dewi',  'sari@gmail.com','08222222222','10000000-0000-0000-0000-000000000003','PlayStation 5',    2,'2024-12-19','15:00',4,120000, 'pending',     '2024-12-19'),
        ('20000000-0000-0000-0000-000000000011','BKK7L8M9N0','00000000-0000-0000-0000-000000000001','Budi Santoso','budi@gmail.com','08111111111','10000000-0000-0000-0000-000000000002','PlayStation 4 Pro',2,'2024-12-20','20:00',3, 60000, 'dikonfirmasi','2024-12-20')
      ON CONFLICT (no_booking) DO NOTHING;
    `)

    console.log('✅ Seed data berhasil!')
  } catch (err) {
    console.error('❌ Seed gagal:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
