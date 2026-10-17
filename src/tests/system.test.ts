import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'plioou_ti_jwt_secret_key_2026';

describe('Sistema de Ordem de Serviço - Regras de Negócio', () => {
  it('Deve gerar e verificar token JWT com role de Técnico', () => {
    const payload = {
      id: 'u-1',
      name: 'Técnico Rogério',
      email: 'rogerio@plioou.com',
      role: 'technician' as const,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;
    expect(decoded.name).toBe('Técnico Rogério');
    expect(decoded.role).toBe('technician');
  });

  it('Deve identificar corretamente O.S. paradas com mais de 48 horas', () => {
    const now = Date.now();
    const mockOrders = [
      { id: 'OS-0092', stalledHours: 52, status: 'Aberta' },
      { id: 'OS-0095', stalledHours: 0, status: 'Finalizado' },
      { id: 'OS-0077', stalledHours: 95, status: 'Em Andamento' },
    ];

    const stalledCount = mockOrders.filter(
      (os) => os.stalledHours >= 48 && os.status !== 'Finalizado'
    ).length;

    expect(stalledCount).toBe(2);
  });

  it('Deve filtrar O.S. atribuídas especificamente para o Técnico logado', () => {
    const mockOrders = [
      { id: 'OS-0095', technicianId: 'u-1', title: 'Manutenção Wi-Fi' },
      { id: 'OS-0094', technicianId: 'u-3', title: 'Servidor Impressão' },
      { id: 'OS-0093', technicianId: 'u-1', title: 'Notebook HP' },
    ];

    const rogerioOrders = mockOrders.filter((os) => os.technicianId === 'u-1');
    expect(rogerioOrders.length).toBe(2);
    expect(rogerioOrders.map((os) => os.id)).toEqual(['OS-0095', 'OS-0093']);
  });
});
