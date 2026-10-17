import { ServerUser, defaultUsersFixture } from '../seed/fixtures/users.fixture.js';
import { isPgConnected, query } from '../db.js';
import { loadJsonFile, saveJsonFile } from '../diskStorage.js';
import { logger } from '../utils/logger.js';

class UsersRepository {
  private fallbackStore: ServerUser[] = loadJsonFile<ServerUser[]>('users.json', defaultUsersFixture);

  private persistFallback() {
    saveJsonFile('users.json', this.fallbackStore);
  }

  async findAll(): Promise<ServerUser[]> {
    if (isPgConnected()) {
      try {
        const res = await query(`
          SELECT id, name, email, role, avatar, active, must_change_password as "mustChangePassword",
                 token_version as "tokenVersion", created_at as "createdAt", last_login_at as "lastLoginAt"
          FROM users ORDER BY created_at ASC
        `);
        return res.rows;
      } catch (err) {
        logger.error({ err }, 'Error in UsersRepository.findAll, falling back to local store');
      }
    }
    return [...this.fallbackStore];
  }

  async findById(id: string): Promise<ServerUser | null> {
    if (isPgConnected()) {
      try {
        const res = await query(
          `SELECT id, name, email, role, avatar, password_hash as "passwordHash", active,
                  must_change_password as "mustChangePassword", token_version as "tokenVersion",
                  created_at as "createdAt", last_login_at as "lastLoginAt"
           FROM users WHERE id = $1 LIMIT 1`,
          [id]
        );
        return res.rows[0] || null;
      } catch (err) {
        logger.error({ err, id }, 'Error in UsersRepository.findById');
      }
    }
    return this.fallbackStore.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<ServerUser | null> {
    const normalized = email.trim().toLowerCase();
    if (isPgConnected()) {
      try {
        const res = await query(
          `SELECT id, name, email, role, avatar, password_hash as "passwordHash", active,
                  must_change_password as "mustChangePassword", token_version as "tokenVersion",
                  created_at as "createdAt", last_login_at as "lastLoginAt"
           FROM users WHERE LOWER(email) = $1 LIMIT 1`,
          [normalized]
        );
        return res.rows[0] || null;
      } catch (err) {
        logger.error({ err, email: normalized }, 'Error in UsersRepository.findByEmail');
      }
    }
    return this.fallbackStore.find((u) => u.email.toLowerCase() === normalized) || null;
  }

  async create(user: ServerUser): Promise<ServerUser> {
    if (isPgConnected()) {
      try {
        await query(
          `INSERT INTO users (id, name, email, role, avatar, password_hash, must_change_password, token_version, active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            user.id,
            user.name,
            user.email.toLowerCase(),
            user.role,
            user.avatar || null,
            user.passwordHash || null,
            user.mustChangePassword || false,
            user.tokenVersion || 1,
            user.active !== false,
            user.createdAt || new Date().toISOString(),
          ]
        );
      } catch (err) {
        logger.error({ err, user }, 'Error in UsersRepository.create on PG');
      }
    }

    const idx = this.fallbackStore.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.fallbackStore[idx] = { ...this.fallbackStore[idx], ...user };
    } else {
      this.fallbackStore.push(user);
    }
    this.persistFallback();
    return user;
  }

  async update(id: string, updates: Partial<ServerUser>): Promise<ServerUser | null> {
    let updated: ServerUser | null = null;

    if (isPgConnected()) {
      try {
        const setClauses: string[] = [];
        const params: any[] = [];
        let pIndex = 1;

        if (updates.name !== undefined) {
          setClauses.push(`name = $${pIndex++}`);
          params.push(updates.name);
        }
        if (updates.email !== undefined) {
          setClauses.push(`email = $${pIndex++}`);
          params.push(updates.email.toLowerCase());
        }
        if (updates.role !== undefined) {
          setClauses.push(`role = $${pIndex++}`);
          params.push(updates.role);
        }
        if (updates.avatar !== undefined) {
          setClauses.push(`avatar = $${pIndex++}`);
          params.push(updates.avatar);
        }
        if (updates.passwordHash !== undefined) {
          setClauses.push(`password_hash = $${pIndex++}`);
          params.push(updates.passwordHash);
        }
        if (updates.mustChangePassword !== undefined) {
          setClauses.push(`must_change_password = $${pIndex++}`);
          params.push(updates.mustChangePassword);
        }
        if (updates.tokenVersion !== undefined) {
          setClauses.push(`token_version = $${pIndex++}`);
          params.push(updates.tokenVersion);
        }
        if (updates.active !== undefined) {
          setClauses.push(`active = $${pIndex++}`);
          params.push(updates.active);
        }
        if (updates.lastLoginAt !== undefined) {
          setClauses.push(`last_login_at = $${pIndex++}`);
          params.push(updates.lastLoginAt);
        }

        if (setClauses.length > 0) {
          params.push(id);
          const res = await query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${pIndex} RETURNING *`,
            params
          );
          if (res.rows.length > 0) {
            updated = res.rows[0];
          }
        }
      } catch (err) {
        logger.error({ err, id, updates }, 'Error in UsersRepository.update');
      }
    }

    const idx = this.fallbackStore.findIndex((u) => u.id === id);
    if (idx >= 0) {
      this.fallbackStore[idx] = { ...this.fallbackStore[idx], ...updates };
      this.persistFallback();
      if (!updated) updated = this.fallbackStore[idx];
    }

    return updated;
  }

  async incrementTokenVersion(id: string): Promise<number> {
    const user = await this.findById(id);
    const newVersion = (user?.tokenVersion || 1) + 1;
    await this.update(id, { tokenVersion: newVersion });
    return newVersion;
  }

  async delete(id: string): Promise<boolean> {
    if (isPgConnected()) {
      try {
        await query('DELETE FROM users WHERE id = $1', [id]);
      } catch (err) {
        logger.error({ err, id }, 'Error deleting user in PG');
      }
    }
    const prevLen = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter((u) => u.id !== id);
    this.persistFallback();
    return this.fallbackStore.length < prevLen;
  }
}

export const usersRepository = new UsersRepository();
