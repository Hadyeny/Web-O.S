/**
 * Configuração centralizada de endpoints da API corporativa Plioou.
 * Evita duplicações e erros de digitação ("hardcoded strings").
 */
export const API_ROUTES = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  authMe: '/api/auth/me',
  users: '/api/users',
  clients: '/api/clients',
  serviceOrders: '/api/service-orders',
  dashboardStats: '/api/dashboard/stats',
  notifications: '/api/notifications',
  notificationsReadAll: '/api/notifications/read-all',
  logs: '/api/logs',
  databaseClear: '/api/database/clear',
  databaseRestore: '/api/database/restore',
  maintenanceStatus: '/api/admin/maintenance/status',
  maintenanceCleanLogs: '/api/admin/maintenance/clean-logs',
  maintenanceBackup: '/api/admin/maintenance/backup',
  reportsProductivity: '/api/reports/productivity',
  reportsDaily: '/api/reports/daily',

  // Rotas com identificadores dinâmicos
  userToggleStatus: (id: string) => `/api/users/${encodeURIComponent(id)}/toggle-status`,
  serviceOrderDetail: (id: string) => `/api/service-orders/${encodeURIComponent(id)}`,
  serviceOrderNotes: (id: string) => `/api/service-orders/${encodeURIComponent(id)}/notes`,
} as const;
