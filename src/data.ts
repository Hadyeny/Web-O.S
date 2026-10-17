import { AppTemplate } from './types';

export const STARTER_TEMPLATES: AppTemplate[] = [
  {
    id: 'vendas-pdv',
    title: 'Sistema de Vendas & PDV',
    category: 'Comércio',
    description: 'Frente de caixa ágil com catálogo de produtos, cálculo de troco e registro de vendas diárias.',
    suggestedPrompt: 'Crie um sistema de vendas e PDV completo com carrinho, busca de produtos, formas de pagamento (Pix, Cartão, Dinheiro) e histórico de vendas.',
    badge: 'Popular',
  },
  {
    id: 'catalogo-whatsapp',
    title: 'Catálogo de Produtos & WhatsApp',
    category: 'Vendas Online',
    description: 'Vitrine digital com fotos, preços, carrinho de compras e envio do pedido formatado diretamente para o WhatsApp.',
    suggestedPrompt: 'Construa uma vitrine de produtos moderna com filtros por categoria, carrinho e botão para finalizar pedido enviando mensagem para o WhatsApp da loja.',
    badge: 'Recomendado',
  },
  {
    id: 'gestao-pedidos-clientes',
    title: 'Controle de Clientes & Pedidos',
    category: 'Gestão',
    description: 'Painel para cadastro de clientes, status de pedidos (Pendente, Em Produção, Entregue) e recibos.',
    suggestedPrompt: 'Desenvolva um painel de gerenciamento de clientes e pedidos com busca rápida, status kanban e exportação de comprovante.',
    badge: 'Gestão',
  },
  {
    id: 'fluxo-caixa',
    title: 'Controle Financeiro & Fluxo de Caixa',
    category: 'Finanças',
    description: 'Acompanhamento de receitas, despesas do mês, contas a pagar/receber e gráficos de faturamento.',
    suggestedPrompt: 'Faça um painel de fluxo de caixa para pequenas empresas com registro de entradas e saídas, filtros por data e resumo do saldo.',
    badge: 'Financeiro',
  },
];
