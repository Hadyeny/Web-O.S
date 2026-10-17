import { Notification } from '../../src/types.js';
import { isPgConnected, query } from '../db.js';
import { loadJsonFile, saveJsonFile } from '../diskStorage.js';
import { logger } from '../utils/logger.js';

class NotificationsRepository {
  private fallbackStore: Notification[] = loadJsonFile<Notification[]>('notifications.json', []);

  private persistFallback() {
    saveJsonFile('notifications.json', this.fallbackStore);
  }

  async findByUser(userId: string, limit = 50): Promise<Notification[]> {
    if (isPgConnected()) {
      try {
        const res = await query(
          `SELECT id, user_id as "userId", title, message, type, os_id as "osId", read, created_at as "createdAt"
           FROM notifications
           WHERE user_id = 'all' OR user_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [userId, limit]
        );
        return res.rows;
      } catch (err) {
        logger.error({ err }, 'Error in NotificationsRepository.findByUser');
      }
    }

    return this.fallbackStore
      .filter((n) => n.userId === 'all' || n.userId === userId)
      .slice(0, limit);
  }

  async create(notif: Notification): Promise<Notification> {
    if (isPgConnected()) {
      try {
        await query(
          `INSERT INTO notifications (id, user_id, title, message, type, os_id, read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            notif.id,
            notif.userId,
            notif.title,
            notif.message,
            notif.type,
            notif.osId || null,
            notif.read || false,
            notif.createdAt || new Date().toISOString(),
          ]
        );
      } catch (err) {
        logger.error({ err, notif }, 'Error creating Notification in PG');
      }
    }

    this.fallbackStore.unshift(notif);
    this.persistFallback();
    return notif;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    if (isPgConnected()) {
      try {
        await query(
          `UPDATE notifications SET read = TRUE WHERE user_id = 'all' OR user_id = $1`,
          [userId]
        );
      } catch (err) {
        logger.error({ err, userId }, 'Error marking notifications as read in PG');
      }
    }

    this.fallbackStore.forEach((n) => {
      if (n.userId === 'all' || n.userId === userId) {
        n.read = true;
      }
    });
    this.persistFallback();
    return true;
  }
}

export const notificationsRepository = new NotificationsRepository();
