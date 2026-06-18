import pool from './database'

const migrate = async () => {
  const client = await pool.connect()
  try {
    console.log('🔄 Menjalankan migrasi database...')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nama        VARCHAR(100) NOT NULL,
        username    VARCHAR(50)  NOT NULL UNIQUE,
        email       VARCHAR(150) NOT NULL UNIQUE,
        no_hp       VARCHAR(15)  NOT NULL,
        password    TEXT         NOT NULL,
        role        VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
        created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS consoles (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nama          VARCHAR(100) NOT NULL,
        deskripsi     TEXT,
        harga_per_jam INTEGER      NOT NULL CHECK (harga_per_jam > 0),
        stok          INTEGER      NOT NULL DEFAULT 1 CHECK (stok >= 0),
        status        VARCHAR(15)  NOT NULL DEFAULT 'tersedia' CHECK (status IN ('tersedia','maintenance')),
        gambar        TEXT,
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        no_booking        VARCHAR(15)  NOT NULL UNIQUE,
        user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nama_user         VARCHAR(100) NOT NULL,
        email_user        VARCHAR(150) NOT NULL,
        no_hp_user        VARCHAR(15)  NOT NULL,
        console_id        UUID         NOT NULL REFERENCES consoles(id) ON DELETE RESTRICT,
        nama_console      VARCHAR(100) NOT NULL,
        jumlah_stick      INTEGER      NOT NULL DEFAULT 2 CHECK (jumlah_stick BETWEEN 1 AND 4),
        tanggal_booking   DATE         NOT NULL,
        waktu_mulai       TIME         NOT NULL,
        durasi            INTEGER      NOT NULL CHECK (durasi BETWEEN 1 AND 12),
        total_biaya       INTEGER      NOT NULL CHECK (total_biaya > 0),
        status            VARCHAR(15)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','dikonfirmasi','selesai','dibatalkan')),
        bukti_pembayaran  TEXT,
        created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id   ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_tanggal   ON bookings(tanggal_booking);
    `)

    console.log('✅ Migrasi berhasil!')
  } catch (err) {
    console.error('❌ Migrasi gagal:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()