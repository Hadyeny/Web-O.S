import { ServiceOrder, ServiceOrderNote, DashboardStats, TechProductivity } from '../../src/types.js';
import { syntheticServiceOrdersFixture } from '../seed/fixtures/service-orders.fixture.js';
import { isPgConnected, query } from '../db.js';
import { loadJsonFile, saveJsonFile } from '../diskStorage.js';
import { usersRepository } from './users.repository.js';
import { logger } from '../utils/logger.js';

class ServiceOrdersRepository {
  private fallbackStore: ServiceOrder[] = loadJsonFile<ServiceOrder[]>('service_orders.json', syntheticServiceOrdersFixture);

  private persistFallback() {
    saveJsonFile('service_orders.json', this.fallbackStore);
  }

  async generateNextId(): Promise<string> {
    if (isPgConnected()) {
      try {
        const res = await query(`SELECT nextval('os_number_seq') as seq`);
        const seq = Number(res.rows[0]?.seq || 1);
        return `OS-${String(seq).padStart(4, '0')}`;
      } catch (err) {
        logger.error({ err }, 'Error generating next OS sequence from PG');
      }
    }

    // Resilient fallback: find highest OS-XXXX number and add 1
    let maxNum = 0;
    for (const os of this.fallbackStore) {
      const match = os.id?.match(/OS-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = Math.max(maxNum + 1, 1);
    return `OS-${String(nextNum).padStart(4, '0')}`;
  }

  async findAll(filters?: { technicianId?: string; status?: string }): Promise<ServiceOrder[]> {
    if (isPgConnected()) {
      try {
        let sql = `
          SELECT id, client_id as "clientId", client_name as "clientName",
                 equipment, category, description, status, priority,
                 technician_id as "technicianId", technician_name as "technicianName",
                 origin, attendance_type as "attendanceType", technical_solution as "technicalSolution",
                 checklist, notes, valor, payment_method as "paymentMethod",
                 client_password_encrypted as "clientPasswordEncrypted",
                 signed_by as "signedBy", signed_at as "signedAt", signature_hash as "signatureHash",
                 client_signature as "clientSignature", closed_at as "closedAt", closed_by as "closedBy",
                 stalled_hours as "stalledHours", created_at as "createdAt", updated_at as "updatedAt"
          FROM service_orders
          WHERE 1=1
        `;
        const params: any[] = [];
        let pIndex = 1;

        if (filters?.technicianId) {
          sql += ` AND technician_id = $${pIndex++}`;
          params.push(filters.technicianId);
        }
        if (filters?.status && filters.status !== 'all') {
          sql += ` AND status = $${pIndex++}`;
          params.push(filters.status);
        }

        sql += ` ORDER BY created_at DESC`;
        const res = await query(sql, params);
        return res.rows;
      } catch (err) {
        logger.error({ err }, 'Error in ServiceOrdersRepository.findAll');
      }
    }

    let result = [...this.fallbackStore];
    if (filters?.technicianId) {
      result = result.filter((os) => os.technicianId === filters.technicianId);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((os) => os.status === filters.status);
    }
    return result;
  }

  async findById(id: string): Promise<ServiceOrder | null> {
    const cleanId = id.trim();
    if (isPgConnected()) {
      try {
        const res = await query(
          `SELECT id, client_id as "clientId", client_name as "clientName",
                  equipment, category, description, status, priority,
                  technician_id as "technicianId", technician_name as "technicianName",
                  origin, attendance_type as "attendanceType", technical_solution as "technicalSolution",
                  checklist, notes, valor, payment_method as "paymentMethod",
                  client_password_encrypted as "clientPasswordEncrypted",
                  signed_by as "signedBy", signed_at as "signedAt", signature_hash as "signatureHash",
                  client_signature as "clientSignature", closed_at as "closedAt", closed_by as "closedBy",
                  stalled_hours as "stalledHours", created_at as "createdAt", updated_at as "updatedAt"
           FROM service_orders
           WHERE id = $1 OR LOWER(id) = LOWER($1)
           LIMIT 1`,
          [cleanId]
        );
        return res.rows[0] || null;
      } catch (err) {
        logger.error({ err, id: cleanId }, 'Error in ServiceOrdersRepository.findById');
      }
    }
    return this.fallbackStore.find((os) => os.id?.toLowerCase() === cleanId.toLowerCase()) || null;
  }

  async create(os: ServiceOrder): Promise<ServiceOrder> {
    if (isPgConnected()) {
      try {
        await query(
          `INSERT INTO service_orders (
            id, client_id, client_name, equipment, category, description,
            status, priority, technician_id, technician_name, origin, attendance_type,
            technical_solution, checklist, notes, valor, payment_method,
            client_password_encrypted, stalled_hours, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
          [
            os.id,
            os.clientId,
            os.clientName,
            os.equipment,
            os.category || 'Geral',
            os.description,
            os.status || 'Aberta',
            os.priority || 'Média',
            os.technicianId || null,
            os.technicianName || null,
            os.origin || 'Interna',
            os.attendanceType || 'presential',
            os.technicalSolution || null,
            JSON.stringify(os.checklist || []),
            JSON.stringify(os.notes || []),
            os.valor || 0,
            os.paymentMethod || null,
            os.clientPasswordEncrypted || null,
            os.stalledHours || 0,
            os.createdAt || new Date().toISOString(),
            os.updatedAt || new Date().toISOString(),
          ]
        );
      } catch (err) {
        logger.error({ err, os }, 'Error creating ServiceOrder in PG');
      }
    }

    this.fallbackStore.unshift(os);
    this.persistFallback();
    return os;
  }

  async update(id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder | null> {
    let updated: ServiceOrder | null = null;
    const nowIso = new Date().toISOString();

    if (isPgConnected()) {
      try {
        const setClauses: string[] = ['updated_at = $' + 1];
        const params: any[] = [nowIso];
        let pIndex = 2;

        if (updates.clientId !== undefined) {
          setClauses.push(`client_id = $${pIndex++}`);
          params.push(updates.clientId);
        }
        if (updates.clientName !== undefined) {
          setClauses.push(`client_name = $${pIndex++}`);
          params.push(updates.clientName);
        }
        if (updates.equipment !== undefined) {
          setClauses.push(`equipment = $${pIndex++}`);
          params.push(updates.equipment);
        }
        if (updates.category !== undefined) {
          setClauses.push(`category = $${pIndex++}`);
          params.push(updates.category);
        }
        if (updates.description !== undefined) {
          setClauses.push(`description = $${pIndex++}`);
          params.push(updates.description);
        }
        if (updates.status !== undefined) {
          setClauses.push(`status = $${pIndex++}`);
          params.push(updates.status);
        }
        if (updates.priority !== undefined) {
          setClauses.push(`priority = $${pIndex++}`);
          params.push(updates.priority);
        }
        if (updates.technicianId !== undefined) {
          setClauses.push(`technician_id = $${pIndex++}`);
          params.push(updates.technicianId);
        }
        if (updates.technicianName !== undefined) {
          setClauses.push(`technician_name = $${pIndex++}`);
          params.push(updates.technicianName);
        }
        if (updates.technicalSolution !== undefined) {
          setClauses.push(`technical_solution = $${pIndex++}`);
          params.push(updates.technicalSolution);
        }
        if (updates.origin !== undefined) {
          setClauses.push(`origin = $${pIndex++}`);
          params.push(updates.origin);
        }
        if (updates.attendanceType !== undefined) {
          setClauses.push(`attendance_type = $${pIndex++}`);
          params.push(updates.attendanceType);
        }
        if (updates.checklist !== undefined) {
          setClauses.push(`checklist = $${pIndex++}`);
          params.push(JSON.stringify(updates.checklist));
        }
        if (updates.notes !== undefined) {
          setClauses.push(`notes = $${pIndex++}`);
          params.push(JSON.stringify(updates.notes));
        }
        if (updates.valor !== undefined) {
          setClauses.push(`valor = $${pIndex++}`);
          params.push(updates.valor);
        }
        if (updates.paymentMethod !== undefined) {
          setClauses.push(`payment_method = $${pIndex++}`);
          params.push(updates.paymentMethod);
        }
        if (updates.clientPasswordEncrypted !== undefined) {
          setClauses.push(`client_password_encrypted = $${pIndex++}`);
          params.push(updates.clientPasswordEncrypted);
        }
        if (updates.signedBy !== undefined) {
          setClauses.push(`signed_by = $${pIndex++}`);
          params.push(updates.signedBy);
        }
        if (updates.signedAt !== undefined) {
          setClauses.push(`signed_at = $${pIndex++}`);
          params.push(updates.signedAt);
        }
        if (updates.signatureHash !== undefined) {
          setClauses.push(`signature_hash = $${pIndex++}`);
          params.push(updates.signatureHash);
        }
        if (updates.clientSignature !== undefined) {
          setClauses.push(`client_signature = $${pIndex++}`);
          params.push(updates.clientSignature);
        }
        if (updates.closedAt !== undefined) {
          setClauses.push(`closed_at = $${pIndex++}`);
          params.push(updates.closedAt);
        }
        if (updates.closedBy !== undefined) {
          setClauses.push(`closed_by = $${pIndex++}`);
          params.push(updates.closedBy);
        }

        params.push(id);
        const res = await query(
          `UPDATE service_orders SET ${setClauses.join(', ')} WHERE id = $${pIndex} RETURNING *`,
          params
        );
        if (res.rows.length > 0) {
          updated = res.rows[0];
        }
      } catch (err) {
        logger.error({ err, id, updates }, 'Error updating ServiceOrder in PG');
      }
    }

    const idx = this.fallbackStore.findIndex((os) => os.id === id);
    if (idx >= 0) {
      this.fallbackStore[idx] = {
        ...this.fallbackStore[idx],
        ...updates,
        updatedAt: nowIso,
      };
      this.persistFallback();
      if (!updated) updated = this.fallbackStore[idx];
    }

    return updated;
  }

  async addNote(id: string, note: ServiceOrderNote): Promise<ServiceOrder | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const currentNotes = existing.notes || [];
    const updatedNotes = [...currentNotes, note];
    return this.update(id, { notes: updatedNotes });
  }

  async delete(id: string): Promise<boolean> {
    if (isPgConnected()) {
      try {
        await query('DELETE FROM service_orders WHERE id = $1', [id]);
      } catch (err) {
        logger.error({ err, id }, 'Error deleting ServiceOrder from PG');
      }
    }

    const prevLen = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter((os) => os.id !== id);
    this.persistFallback();
    return this.fallbackStore.length < prevLen;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const all = await this.findAll();
    const users = await usersRepository.findAll();

    const totalOS = all.length;
    const abertas = all.filter((os) => os.status === 'Aberta').length;
    const emAndamento = all.filter((os) => os.status === 'Em Andamento').length;
    const aguardandoCliente = all.filter((os) => os.status === 'Aguardando Cliente' || os.status === 'Aguardando Peças').length;
    const finalizadas = all.filter((os) => os.status === 'Finalizado' || os.status === 'Encerrado').length;
    const atendExterno = all.filter((os) => os.origin === 'Externa' || (os as any).serviceType === 'externo').length;

    const stalledOrders = all
      .filter((os) => (os.stalledHours || 0) >= 48 && os.status !== 'Finalizado' && os.status !== 'Encerrado')
      .sort((a, b) => (b.stalledHours || 0) - (a.stalledHours || 0));

    const technicians = users.filter((u) => (u.role || '').toLowerCase() === 'technician' || (u.role || '').toLowerCase() === 'tecnico');
    const productivity: TechProductivity[] = technicians.map((tech) => {
      const techOrders = all.filter((os) => os.technicianId === tech.id);
      const inProgressCount = techOrders.filter((os) => os.status === 'Em Andamento' || os.status === 'Aberta').length;
      const completedCount = techOrders.filter((os) => os.status === 'Finalizado' || os.status === 'Encerrado').length;
      return {
        technicianId: tech.id,
        technicianName: tech.name,
        totalAssigned: techOrders.length,
        inProgressCount,
        completedCount,
        avgResolutionHours: techOrders.length > 0 ? 2 : 0,
      };
    });

    return {
      totalOS,
      abertas,
      emAndamento,
      aguardandoCliente,
      finalizadas,
      atendExterno,
      stalledOrders,
      productivity,
    };
  }
}

export const serviceOrdersRepository = new ServiceOrdersRepository();
