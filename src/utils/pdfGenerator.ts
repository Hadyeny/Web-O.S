import jsPDF from 'jspdf';
import { ServiceOrder } from '../types';

/**
 * Gera um Relatório Simples em PDF (Formatado para envio ao Cliente)
 */
export function generateSimplePDF(os: ServiceOrder) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Colors & Accent
  doc.setFillColor(37, 99, 235); // Blue #2563eb
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Plioou TI - Relatório de Atendimento', 15, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprovante de Chamado Técnico', 15, 22);

  // OS Number Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(145, 8, 50, 12, 3, 3, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`OS: ${os.id}`, 150, 16);

  // Section 1: Dados Principais
  let y = 38;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Informações do Cliente & Serviço', 15, y);
  y += 3;

  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);
  y += 8;

  doc.setFontSize(10);
  
  // Grid row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(os.clientName, 40, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 120, y);
  doc.setFont('helvetica', 'bold');
  if (os.status === 'Finalizado') {
    doc.setTextColor(16, 185, 129);
  } else if (os.status === 'Em Andamento') {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(37, 99, 235);
  }
  doc.text(os.status.toUpperCase(), 140, y);
  doc.setTextColor(30, 41, 59);

  y += 8;

  // Grid row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Equipamento:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(os.equipment || 'Não especificado', 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Categoria:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(os.category || 'Geral', 145, y);

  y += 8;

  // Grid row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Abertura:', 15, y);
  doc.setFont('helvetica', 'normal');
  const dateFormatted = new Date(os.createdAt).toLocaleDateString('pt-BR') + ' às ' + new Date(os.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  doc.text(dateFormatted, 40, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Técnico:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(os.technicianName || 'Técnico Plioou TI', 140, y);

  y += 14;

  // Section 2: Descrição do Problema
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Descrição Solicitada', 15, y);
  y += 3;
  doc.line(15, y, 195, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitDesc = doc.splitTextToSize(os.description || 'Sem descrição cadastrada.', 175);
  doc.text(splitDesc, 15, y);
  y += splitDesc.length * 6 + 10;

  // Section 3: Resumo da Solução / Laudo Técnico
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Resumo de Resolução / Laudo Técnico', 15, y);
  y += 3;
  doc.line(15, y, 195, y);
  y += 8;

  const lastNote = os.technicalSolution || (os.notes && os.notes.length > 0 ? os.notes[0].content : 'Atendimento concluído e verificado pela equipe técnica.');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitRes = doc.splitTextToSize(lastNote, 175);
  doc.text(splitRes, 15, y);
  y += splitRes.length * 6 + 8;

  // Section 4: Financeiro & Faturamento (Se Houver)
  if (os.totalCost !== undefined || os.laborCost !== undefined || os.partsCost !== undefined) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Detalhamento Financeiro', 15, y);
    y += 3;
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Mão de Obra:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`R$ ${(os.laborCost || 0).toFixed(2)}`, 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Peças/Suprimentos:', 90, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`R$ ${(os.partsCost || 0).toFixed(2)}`, 135, y);

    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Desconto:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`R$ ${(os.discountCost || 0).toFixed(2)}`, 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('VALOR TOTAL:', 90, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`R$ ${(os.totalCost || 0).toFixed(2)} (${os.paymentMethod || 'A combinar'})`, 125, y);
    doc.setTextColor(30, 41, 59);

    y += 12;
  } else {
    y += 12;
  }

  // Signatures Area
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Técnico Responsável', 55, y, { align: 'center' });
  doc.text('Assinatura / Aceite do Cliente', 155, y, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Plioou TI - Gestão de Ordens de Serviço | Documento gerado em ' + new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 105, 285, { align: 'center' });

  doc.save(`Relatorio_Simples_${os.id}.pdf`);
}

/**
 * Gera um Relatório Técnico Completo em PDF (Com todo o Histórico de Apontamentos)
 */
export function generateCompletePDF(os: ServiceOrder) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Colors & Accent
  doc.setFillColor(15, 23, 42); // Dark Slate #0f172a
  doc.rect(0, 0, 210, 30, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Plioou TI - Relatório Técnico Completo', 15, 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Histórico Integral de Manutenção e Apontamentos Auditados', 15, 23);

  // OS Badge
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(140, 8, 55, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`OS: ${os.id}`, 167, 17, { align: 'center' });

  let y = 40;

  // Header Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, 180, 42, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  
  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 20, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(os.clientName, 40, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 110, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(os.status, 130, y + 8);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Equipamento:', 20, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(os.equipment || 'Não informado', 50, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Prioridade:', 110, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(os.priority || 'Média', 135, y + 17);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Abertura:', 20, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(os.createdAt).toLocaleString('pt-BR'), 40, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('Técnico:', 110, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(os.technicianName || 'Sem técnico atribuído', 130, y + 26);

  // Row 4
  doc.setFont('helvetica', 'bold');
  doc.text('Categoria:', 20, y + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(os.category || 'Suporte Geral', 45, y + 35);

  y += 50;

  // Section: Descrição Inicial
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Relato do Problema / Solicitação', 15, y);
  y += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(15, y, 195, y);
  y += 7;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(os.description || 'Sem descrição cadastrada.', 175);
  doc.text(descLines, 15, y);
  y += descLines.length * 5 + 8;

  // Section: Checklist / Verificações se houver
  if (os.checklist && os.checklist.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('2. Lista de Verificação Técnica (Checklist)', 15, y);
    y += 3;
    doc.line(15, y, 195, y);
    y += 7;

    os.checklist.forEach((item) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      const checkMark = item.checked ? '[X]' : '[ ]';
      const labelText = `${checkMark} ${item.label}${item.required ? ' *' : ''}`;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', item.checked ? 'bold' : 'normal');
      doc.setTextColor(item.checked ? 16 : 100, item.checked ? 185 : 116, item.checked ? 129 : 139);
      doc.text(labelText, 18, y);
      
      if (item.notes) {
        y += 4;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(71, 85, 105);
        doc.text(`   Nota: ${item.notes}`, 22, y);
      }
      y += 6;
    });
    y += 6;
  }

  // Section: Complete History
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  const sectionNum = os.checklist && os.checklist.length > 0 ? '3' : '2';
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`${sectionNum}. Linha do Tempo & Histórico de Apontamentos`, 15, y);
  y += 3;
  doc.line(15, y, 195, y);
  y += 8;

  if (!os.notes || os.notes.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum apontamento registrado para esta Ordem de Serviço.', 15, y);
    y += 10;
  } else {
    os.notes.forEach((note, index) => {
      // Check page overflow
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const noteDate = new Date(note.createdAt).toLocaleString('pt-BR');
      
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, 180, 6, 1, 1, 'F');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`#${index + 1} - Autor: ${note.authorName} (${note.authorRole})`, 18, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(noteDate, 190, y + 4.2, { align: 'right' });

      y += 8;

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      const contentLines = doc.splitTextToSize(note.content, 175);
      doc.text(contentLines, 18, y);
      y += contentLines.length * 5 + 6;
    });
  }

  // Check page overflow for footer signature
  if (y > 230) {
    doc.addPage();
    y = 30;
  } else {
    y += 10;
  }

  // Signatures Area
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Técnico Responsável', 55, y, { align: 'center' });
  doc.text('Supervisor / Gestor de TI', 155, y, { align: 'center' });

  // Page Numbers / Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Plioou TI - Relatório Completo OS ${os.id} | Página ${i} de ${totalPages}`, 105, 287, { align: 'center' });
  }

  doc.save(`Relatorio_Completo_${os.id}.pdf`);
}

/**
 * Gera PDF de Proposta Comercial de Orçamento para envio ao Cliente
 */
export function generateQuotePDF(os: ServiceOrder) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner - Indigo Accent for Commercial Quote
  doc.setFillColor(79, 70, 229); // Indigo #4f46e5
  doc.rect(0, 0, 210, 30, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PLIOOU TI & SERVIÇOS', 15, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Proposta Comercial de Orçamento', 15, 23);

  // OS Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(140, 8, 55, 14, 3, 3, 'F');
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Orçamento OS: ${os.id}`, 143, 17);

  let y = 40;

  // Client & Equipment Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Identificação do Cliente e Equipamento', 15, y);
  y += 3;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(os.clientName, 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('pt-BR'), 135, y);

  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Equipamento:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(os.equipment, 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Status Cotação:', 120, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(os.quoteStatus || 'Pendente', 152, y);
  doc.setTextColor(30, 41, 59);

  y += 12;

  // Section 2: Detalhamento do Orçamento (Peças e Serviços)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Peças, Componentes e Mão de Obra Estimada', 15, y);
  y += 3;
  doc.line(15, y, 195, y);
  y += 8;

  const quoteItems = os.quoteItems || [];
  if (quoteItems.length > 0) {
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 7, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Item / Componente', 18, y + 5);
    doc.text('Qtd', 120, y + 5, { align: 'center' });
    doc.text('Valor Un. (R$)', 150, y + 5, { align: 'right' });
    doc.text('Subtotal (R$)', 190, y + 5, { align: 'right' });

    y += 9;

    let partsTotal = 0;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    quoteItems.forEach((item) => {
      const subtotal = item.quantity * item.unitPrice;
      partsTotal += subtotal;

      doc.text(item.name, 18, y);
      doc.text(String(item.quantity), 120, y, { align: 'center' });
      doc.text(item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 150, y, { align: 'right' });
      doc.text(subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 190, y, { align: 'right' });

      y += 6;
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y - 2, 195, y - 2);
    });

    y += 4;
  } else {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma peça discriminada especificamente.', 15, y);
    y += 10;
  }

  // Financial Breakdown Box
  const numLabor = os.laborCost || 0;
  const numParts = os.partsCost !== undefined ? os.partsCost : quoteItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const numDiscount = os.discountCost || 0;
  const totalVal = Math.max(0, numParts + numLabor - numDiscount);

  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, y, 180, 28, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text(`Subtotal Peças / Insumos:`, 20, y + 7);
  doc.text(`R$ ${numParts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, y + 7);

  doc.text(`Mão de Obra Técnica Estimada:`, 20, y + 13);
  doc.text(`R$ ${numLabor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, y + 13);

  if (numDiscount > 0) {
    doc.text(`Desconto Concedido:`, 20, y + 19);
    doc.text(`- R$ ${numDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, y + 19);
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`VALOR TOTAL ESTIMADO:`, 20, y + 24);
  doc.text(`R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, y + 24);

  y += 36;

  // Notes & Terms
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. Observações e Condições de Fornecimento', 15, y);
  y += 3;
  doc.line(15, y, 195, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const notesText = os.quoteNotes || 'Garantia de 90 dias para peças substituídas e serviços executados. Prazo de validade do orçamento: 7 dias úteis.';
  const splitNotes = doc.splitTextToSize(notesText, 180);
  doc.text(splitNotes, 15, y);
  y += splitNotes.length * 5 + 15;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Plioou TI & Serviços', 55, y, { align: 'center' });
  doc.text('Aceite do Cliente', 155, y, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Plioou TI & Serviços | Proposta de Orçamento OS ${os.id}`, 105, 287, { align: 'center' });

  doc.save(`Orcamento_${os.id}.pdf`);
}

