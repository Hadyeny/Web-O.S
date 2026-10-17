import { AuditLog } from '../../src/types.js';
import { isPgConnected, query } from '../db.js';
import { loadJsonFile, saveJsonFile } from '../diskStorage.js';
import { logger } from '../utils/logger.js';

class AuditLogsRepository {
  private fallbackStore: AuditLog[] = loadJsonFile<AuditLog[]>('audit_logs.json', [
    {
      id: 'log-boot-1',
      userId: 'u-1',
      userName: 'Sistema',
      userRole: 'admin',
      action: 'SISTEMA_REFATORADO',
      targetId: 'system',
      details: 'Repositórios unificados, proteção LGPD e autenticação segura implementadas com sucesso.',
      createdAt: new Date().toISOString(),
    },
  ]);

  private persistFallback() {
    saveJsonFile('audit_logs.json', this.fallbackStore);
  }

  async findAll(limit = 100): Promise<AuditLog[]> {
    if (isPgConnected()) {
      try {
        const res = await query(
          `SELECT id, user_id as "userId", user_name as "userName",
                  user_role as "userRole", action, target_id as "targetId",
                  details, created_at as "createdAt"
           FROM audit_logs
           ORDER BY created_at DESC
           LIMIT $1`,
          [limit]
        );
        return res.rows;
      } catch (err) {
        logger.error({ err }, 'Error in AuditLogsRepository.findAll');
      }
    }
    return this.fallbackStore.slice(0, limit);
  }

  async create(log: AuditLog): Promise<AuditLog> {
    if (isPgConnected()) {
      try {
        await query(
          `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, target_id, details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            log.id,
            log.userId,
            log.userName,
            log.userRole,
            log.action,
            log.targetId,
            log.details,
            log.createdAt || new Date().toISOString(),
          ]
        );
      } catch (err) {
        logger.error({ err, log }, 'Error creating AuditLog in PG');
      }
    }

    this.fallbackStore.unshift(log);
    this.persistFallback();
    return log;
  }
}

export const auditLogsRepository = new AuditLogsRepository();
