import { Client } from '../../src/types.js';
import { syntheticClientsFixture } from '../seed/fixtures/clients.fixture.js';
import { isPgConnected, query } from '../db.js';
import { loadJsonFile, saveJsonFile } from '../diskStorage.js';
import { logger } from '../utils/logger.js';

class ClientsRepository {
  private fallbackStore: Client[] = loadJsonFile<Client[]>('clients.json', syntheticClientsFixture);

  private persistFallback() {
    saveJsonFile('clients.json', this.fallbackStore);
  }

  async findAll(): Promise<Client[]> {
    if (isPgConnected()) {
      try {
        const res = await query(`
          SELECT id, name, cnpj_or_cpf as "cnpjOrCpf", email, phone, city,
                 address, neighborhood, zip_code as "zipCode", notes,
                 active_orders_count as "activeOrdersCount"
          FROM clients ORDER BY name ASC
        `);
        return res.rows;
      } catch (err) {
        logger.error({ err }, 'Error in ClientsRepository.findAll');
      }
    }
    return [...this.fallbackStore];
  }

  async findById(id: string): Promise<Client | null> {
    if (isPgConnected()) {
      try {
        const res = await query(
          `SELECT id, name, cnpj_or_cpf as "cnpjOrCpf", email, phone, city,
                  address, neighborhood, zip_code as "zipCode", notes,
                  active_orders_count as "activeOrdersCount"
           FROM clients WHERE id = $1 LIMIT 1`,
          [id]
        );
        return res.rows[0] || null;
      } catch (err) {
        logger.error({ err, id }, 'Error in ClientsRepository.findById');
      }
    }
    return this.fallbackStore.find((c) => c.id === id) || null;
  }

  async create(client: Client): Promise<Client> {
    if (isPgConnected()) {
      try {
        await query(
          `INSERT INTO clients (id, name, cnpj_or_cpf, email, phone, city, address, neighborhood, zip_code, notes, active_orders_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            client.id,
            client.name,
            client.cnpjOrCpf || '',
            client.email || '',
            client.phone || '',
            client.city || '',
            client.address || '',
            client.neighborhood || '',
            client.zipCode || '',
            client.notes || '',
            client.activeOrdersCount || 0,
          ]
        );
      } catch (err) {
        logger.error({ err, client }, 'Error in ClientsRepository.create');
      }
    }

    const idx = this.fallbackStore.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      this.fallbackStore[idx] = { ...this.fallbackStore[idx], ...client };
    } else {
      this.fallbackStore.push(client);
    }
    this.persistFallback();
    return client;
  }

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    let updated: Client | null = null;

    if (isPgConnected()) {
      try {
        const setClauses: string[] = [];
        const params: any[] = [];
        let pIndex = 1;

        if (updates.name !== undefined) {
          setClauses.push(`name = $${pIndex++}`);
          params.push(updates.name);
        }
        if (updates.cnpjOrCpf !== undefined) {
          setClauses.push(`cnpj_or_cpf = $${pIndex++}`);
          params.push(updates.cnpjOrCpf);
        }
        if (updates.email !== undefined) {
          setClauses.push(`email = $${pIndex++}`);
          params.push(updates.email);
        }
        if (updates.phone !== undefined) {
          setClauses.push(`phone = $${pIndex++}`);
          params.push(updates.phone);
        }
        if (updates.city !== undefined) {
          setClauses.push(`city = $${pIndex++}`);
          params.push(updates.city);
        }
        if (updates.address !== undefined) {
          setClauses.push(`address = $${pIndex++}`);
          params.push(updates.address);
        }
        if (updates.neighborhood !== undefined) {
          setClauses.push(`neighborhood = $${pIndex++}`);
          params.push(updates.neighborhood);
        }
        if (updates.zipCode !== undefined) {
          setClauses.push(`zip_code = $${pIndex++}`);
          params.push(updates.zipCode);
        }
        if (updates.notes !== undefined) {
          setClauses.push(`notes = $${pIndex++}`);
          params.push(updates.notes);
        }
        if (updates.activeOrdersCount !== undefined) {
          setClauses.push(`active_orders_count = $${pIndex++}`);
          params.push(updates.activeOrdersCount);
        }

        if (setClauses.length > 0) {
          params.push(id);
          const res = await query(
            `UPDATE clients SET ${setClauses.join(', ')} WHERE id = $${pIndex} RETURNING *`,
            params
          );
          if (res.rows.length > 0) {
            updated = res.rows[0];
          }
        }
      } catch (err) {
        logger.error({ err, id, updates }, 'Error in ClientsRepository.update');
      }
    }

    const idx = this.fallbackStore.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.fallbackStore[idx] = { ...this.fallbackStore[idx], ...updates };
      this.persistFallback();
      if (!updated) updated = this.fallbackStore[idx];
    }

    return updated;
  }

  async incrementActiveOrders(id: string, delta: number): Promise<void> {
    if (isPgConnected()) {
      try {
        await query(
          'UPDATE clients SET active_orders_count = GREATEST(0, active_orders_count + $1) WHERE id = $2',
          [delta, id]
        );
      } catch (err) {
        logger.error({ err, id, delta }, 'Error incrementing active orders');
      }
    }

    const client = this.fallbackStore.find((c) => c.id === id);
    if (client) {
      client.activeOrdersCount = Math.max(0, (client.activeOrdersCount || 0) + delta);
      this.persistFallback();
    }
  }

  async delete(id: string): Promise<boolean> {
    if (isPgConnected()) {
      try {
        await query('DELETE FROM clients WHERE id = $1', [id]);
      } catch (err) {
        logger.error({ err, id }, 'Error deleting client from PG');
      }
    }

    const prevLen = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter((c) => c.id !== id);
    this.persistFallback();
    return this.fallbackStore.length < prevLen;
  }
}

export const clientsRepository = new ClientsRepository();
