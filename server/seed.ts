import { usersRepository } from './repositories/users.repository.js';
import { clientsRepository } from './repositories/clients.repository.js';
import { serviceOrdersRepository } from './repositories/service-orders.repository.js';
import { auditLogsRepository } from './repositories/audit-logs.repository.js';
import { notificationsRepository } from './repositories/notifications.repository.js';
import { defaultUsersFixture } from './seed/fixtures/users.fixture.js';
import { syntheticClientsFixture } from './seed/fixtures/clients.fixture.js';
import { syntheticServiceOrdersFixture } from './seed/fixtures/service-orders.fixture.js';
import { initDatabaseConnection } from './db.js';
import { logger } from './utils/logger.js';

export async function runSeed(force = false) {
  logger.info('--- Iniciando Seed do Banco de Dados Plioou TI ---');
  await initDatabaseConnection();

  // Seed Users
  const existingUsers = await usersRepository.findAll();
  if (existingUsers.length === 0 || force) {
    for (const u of defaultUsersFixture) {
      await usersRepository.create(u);
    }
    logger.info({ count: defaultUsersFixture.length }, 'Usuários semeados com sucesso');
  } else {
    logger.info('Usuários já existem no banco. Pulando.');
  }

  // Seed Clients
  const existingClients = await clientsRepository.findAll();
  if (existingClients.length === 0 || force) {
    for (const c of syntheticClientsFixture) {
      await clientsRepository.create(c);
    }
    logger.info({ count: syntheticClientsFixture.length }, 'Clientes sintéticos semeados com sucesso');
  } else {
    logger.info('Clientes já existem no banco. Pulando.');
  }

  // Seed Service Orders
  const existingOrders = await serviceOrdersRepository.findAll();
  if (existingOrders.length === 0 || force) {
    for (const os of syntheticServiceOrdersFixture) {
      await serviceOrdersRepository.create(os);
    }
    logger.info({ count: syntheticServiceOrdersFixture.length }, 'Ordens de serviço semeadas com sucesso');
  } else {
    logger.info('Ordens de serviço já existem no banco. Pulando.');
  }

  // Initial Audit Log
  await auditLogsRepository.create({
    id: `log-seed-${Date.now()}`,
    userId: 'u-1',
    userName: 'Sistema',
    userRole: 'admin',
    action: 'BANCO_SEMEADO',
    targetId: 'database',
    details: 'Base populada com dados sintéticos aderentes à LGPD e repositórios seguros.',
    createdAt: new Date().toISOString(),
  });

  // Initial Notification
  await notificationsRepository.create({
    id: `notif-seed-${Date.now()}`,
    userId: 'all',
    title: 'Sistema Pronto',
    message: 'Base de dados inicializada com fixtures seguras e suporte a PostgreSQL.',
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
  });

  logger.info('--- Seed Concluído com Sucesso! ---');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv.includes('--run')) {
  const force = process.argv.includes('--force');
  runSeed(force).then(() => {
    logger.info('Seed finalizado.');
    process.exit(0);
  }).catch((err) => {
    logger.error({ err }, 'Erro ao executar seed');
    process.exit(1);
  });
}
