import pg from 'pg';
import { logger } from './utils/logger.js';

const { Pool } = pg;

const isPostgresUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
};

const pgUrl = process.env.DATABASE_URL;
let pool: pg.Pool | null = null;
let pgConnected = false;

if (isPostgresUrl(pgUrl)) {
  pool = new Pool({
    connectionString: pgUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
  });
}

export async function initDatabaseConnection(): Promise<boolean> {
  if (!pool) {
    logger.info('PostgreSQL não configurado ou DATABASE_URL ausente. Operando com armazenamento JSON/em-memória resiliente.');
    return false;
  }

  try {
    const client = await pool.connect();
    logger.info('Connected to PostgreSQL successfully.');
    
    // Create tables if not existing
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(30) NOT NULL,
        avatar TEXT,
        password_hash TEXT,
        must_change_password BOOLEAN DEFAULT FALSE,
        token_version INT DEFAULT 1,
        active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        cnpj_or_cpf VARCHAR(30),
        email VARCHAR(100),
        phone VARCHAR(30),
        city VARCHAR(100),
        address VARCHAR(200),
        neighborhood VARCHAR(100),
        zip_code VARCHAR(30),
        notes TEXT,
        active_orders_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS service_orders (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50) REFERENCES clients(id) ON DELETE SET NULL,
        client_name VARCHAR(150),
        equipment VARCHAR(100),
        category VARCHAR(100),
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'Aberta',
        priority VARCHAR(30) NOT NULL DEFAULT 'Média',
        technician_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        technician_name VARCHAR(100),
        origin VARCHAR(50),
        attendance_type VARCHAR(50),
        technical_solution TEXT,
        checklist JSONB DEFAULT '[]'::jsonb,
        notes JSONB DEFAULT '[]'::jsonb,
        valor NUMERIC(10, 2) DEFAULT 0,
        payment_method VARCHAR(50),
        client_password_encrypted TEXT,
        signed_by VARCHAR(150),
        signed_at TIMESTAMPTZ,
        signature_hash TEXT,
        client_signature TEXT,
        closed_at TIMESTAMPTZ,
        closed_by VARCHAR(100),
        stalled_hours INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        user_name VARCHAR(100),
        user_role VARCHAR(30),
        action VARCHAR(100) NOT NULL,
        target_id VARCHAR(100),
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(30) NOT NULL DEFAULT 'info',
        os_id VARCHAR(50),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE SEQUENCE IF NOT EXISTS os_number_seq START 100;

      -- Indexes for performance & query optimization
      CREATE INDEX IF NOT EXISTS idx_os_client_id ON service_orders(client_id);
      CREATE INDEX IF NOT EXISTS idx_os_tech_id ON service_orders(technician_id);
      CREATE INDEX IF NOT EXISTS idx_os_status ON service_orders(status);
      CREATE INDEX IF NOT EXISTS idx_os_created_at ON service_orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read);
    `);
    client.release();
    pgConnected = true;
    logger.info('PostgreSQL schema, sequence and indexes verified.');
    return true;
  } catch (err: any) {
    logger.warn({ err: err?.message || err }, 'Falha na conexão com PostgreSQL. Operando com armazenamento JSON/em-memória resiliente.');
    pgConnected = false;
    return false;
  }
}

export function isPgConnected(): boolean {
  return pgConnected;
}

export function getPool(): pg.Pool | null {
  return pool;
}

export { pool };

export async function query<T = any>(sql: string, params: any[] = []): Promise<pg.QueryResult<T>> {
  if (!pool || !pgConnected) {
    throw new Error('PostgreSQL pool not available');
  }
  return pool.query<T>(sql, params);
}
