/**
 * DEPRECADO: Este arquivo foi mantido apenas para compatibilidade retroativa.
 * Toda a persistência agora opera exclusivamente através dos repositórios:
 * - server/repositories/users.repository.ts
 * - server/repositories/clients.repository.ts
 * - server/repositories/service-orders.repository.ts
 * - server/repositories/audit-logs.repository.ts
 * - server/repositories/notifications.repository.ts
 */

import { usersRepository } from './repositories/users.repository.js';
import { clientsRepository } from './repositories/clients.repository.js';
import { serviceOrdersRepository } from './repositories/service-orders.repository.js';
import { auditLogsRepository } from './repositories/audit-logs.repository.js';
import { notificationsRepository } from './repositories/notifications.repository.js';
import { ServerUser, defaultUsersFixture } from './seed/fixtures/users.fixture.js';
import { syntheticClientsFixture } from './seed/fixtures/clients.fixture.js';
import { syntheticServiceOrdersFixture } from './seed/fixtures/service-orders.fixture.js';
import { initDatabaseConnection } from './db.js';

export type { ServerUser };
export { defaultUsersFixture as defaultUsers };

// Re-exports for legacy code
export const usersStore = defaultUsersFixture;
export const clientsStore = syntheticClientsFixture;
export const serviceOrdersStore = syntheticServiceOrdersFixture;
export const auditLogsStore: any[] = [];
export const notificationsStore: any[] = [];
export const checklistsStore: Record<string, any[]> = {};

export async function initializeDatabase() {
  return initDatabaseConnection();
}

export async function getDashboardStats(_filters?: any) {
  return serviceOrdersRepository.getDashboardStats();
}

export function clearAllDatabase() {}
export function persistUsers() {}
export function persistClients() {}
export function persistServiceOrders() {}
export function persistChecklists() {}
export function persistAuditLogs() {}
export function persistNotifications() {}
