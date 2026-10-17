import { ServiceOrder } from '../types';

/**
 * Identifica se uma Ordem de Serviço é de Atendimento Externo / On-Site
 */
export const isExternalOrder = (os: ServiceOrder): boolean => {
  if (os.isExternal === true) return true;
  if (os.serviceType === 'externo') return true;

  const category = (os.category || '').toLowerCase();
  const equipment = (os.equipment || '').toLowerCase();
  const desc = (os.description || '').toLowerCase();

  return Boolean(
    category.includes('extern') ||
    category.includes('infra') ||
    category.includes('rede') ||
    category.includes('servidor') ||
    equipment.includes('servidor') ||
    equipment.includes('rack') ||
    equipment.includes('roteador') ||
    equipment.includes('switch') ||
    desc.includes('visita') ||
    desc.includes('on-site') ||
    desc.includes('externo') ||
    desc.includes('presencial')
  );
};
