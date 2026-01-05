import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { RegistroProducao } from '@/hooks/useRegistrosProducao';
import logoNutrimilho from '@/assets/logo-nutrimilho.png';

interface OEEMetrics {
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
}

export const exportOEEReport = async (
  registros: RegistroProducao[],
  metrics: OEEMetrics,
  filters?: { dataInicio?: string; dataFim?: string; equipamento?: string }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Calculate metrics from the registros being displayed (not from separate hook)
  let calculatedMetrics = { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 };
  if (registros && registros.length > 0) {
    const sums = registros.reduce((acc: any, r: any) => {
      const paradasSum = r.paradas?.reduce((a: number, p: any) => a + (p.duracao || 0), 0) || 0;
      const disponibilidade = r.tempo_planejado > 0 ? Math.max(0, ((r.tempo_planejado - paradasSum) / r.tempo_planejado) * 100) : 0;
      const metaKg = (r.equipamentos && r.equipamentos.capacidade_hora) || r.capacidade_hora || 0;
      const performance = metaKg > 0 ? Math.min(100, (r.total_produzido / metaKg) * 100) : 0;
      const unidadesBoas = Math.max(0, (r.total_produzido - (r.defeitos || 0)));
      const qualidade = r.total_produzido > 0 ? Math.max(0, (unidadesBoas / r.total_produzido) * 100) : 0;
      const oee = ((disponibilidade / 100) * (performance / 100) * (qualidade / 100)) * 100;

      acc.disponibilidade += disponibilidade;
      acc.performance += performance;
      acc.qualidade += qualidade;
      acc.oee += oee;
      return acc;
    }, { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 });

    const len = registros.length;
    calculatedMetrics = {
      disponibilidade: Number((sums.disponibilidade / len).toFixed(1)),
      performance: Number((sums.performance / len).toFixed(1)),
      qualidade: Number((sums.qualidade / len).toFixed(1)),
      oee: Number((sums.oee / len).toFixed(1)),
    };
  }
  
  // Add logo to top-right corner using absolute URL
  try {
    const logoUrl = `${window.location.origin}${logoNutrimilho}`;
    doc.addImage(logoUrl, 'PNG', pageWidth - 35, 5, 30, 30);
  } catch (e) {
    console.warn('Could not add logo to PDF:', e);
  }
  
  // Header
  doc.setFillColor(46, 125, 50); // Primary green
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório OEE', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Nutrimilho - Sistema de Gestão de Eficiência', 14, 35);
  
  // Date and filters
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  const today = format(new Date(), 'dd/MM/yyyy');
  doc.text(`Gerado em: ${today}`, pageWidth - 50, 50);
  
  if (filters?.dataInicio || filters?.dataFim) {
    const periodo = `Período: ${filters.dataInicio || '-'} até ${filters.dataFim || '-'}`;
    doc.text(periodo, 14, 50);
  }
  
  if (filters?.equipamento) {
    doc.text(`Equipamento: ${filters.equipamento}`, 14, 56);
  }
  
  // Metrics summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo OEE', 14, 70);
  
  // Metrics boxes
  const boxWidth = 42;
  const boxHeight = 25;
  const startY = 75;
  const gap = 4;
  
  const metricsData = [
    { label: 'OEE', value: calculatedMetrics.oee, color: getOEEColor(calculatedMetrics.oee) },
    { label: 'Disponibilidade', value: calculatedMetrics.disponibilidade, color: [25, 118, 210] },
    { label: 'Performance', value: calculatedMetrics.performance, color: [249, 168, 37] },
    { label: 'Qualidade', value: calculatedMetrics.qualidade, color: [123, 31, 162] },
  ];
  
  metricsData.forEach((metric, index) => {
    const x = 14 + (boxWidth + gap) * index;
    
    doc.setFillColor(...metric.color as [number, number, number]);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, x + 4, startY + 8);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metric.value.toFixed(1)}%`, x + 4, startY + 20);
  });
  
  // Production table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Registros de Produção', 14, 115);
  
  const tableData = registros.map((r) => [
    r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '-',
    r.turnos?.nome || '-',
    r.equipamentos?.nome || '-',
    `${Number(r.disponibilidade).toFixed(1)}%`,
    `${Number(r.performance).toFixed(1)}%`,
    `${Number(r.qualidade).toFixed(1)}%`,
    `${Number(r.oee).toFixed(1)}%`,
  ]);
  
  autoTable(doc, {
    startY: 120,
    head: [['Data', 'Turno', 'Equipamento', 'Disp.', 'Perf.', 'Qual.', 'OEE']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 45 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 30,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      '© Nutrimilho - Sistema OEE',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Save
  const filename = `relatorio-oee-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

const getOEEColor = (value: number): [number, number, number] => {
  if (value >= 85) return [46, 125, 50]; // Green
  if (value >= 70) return [124, 179, 66]; // Light green
  if (value >= 50) return [249, 168, 37]; // Yellow
  return [211, 47, 47]; // Red
};

interface ProdutoBloqueado {
  id: string;
  data: string;
  quantidade: number;
  motivo_bloqueio: string;
  numero_lacre: string | null;
  destino: string;
  turnos?: { nome: string } | null;
  equipamentos?: { nome: string } | null;
}

interface QualidadeMetrics {
  totalBloqueado: number;
  qualidadeOEE: number;
  oeeGeral: number;
  porDestino: Record<string, number>;
  porMotivo: Record<string, number>;
}

export const exportQualidadeReport = async (
  produtos: ProdutoBloqueado[],
  metrics: QualidadeMetrics,
  filters?: { dataInicio?: string; dataFim?: string }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add logo to top-right corner using absolute URL
  try {
    const logoUrl = `${window.location.origin}${logoNutrimilho}`;
    doc.addImage(logoUrl, 'PNG', pageWidth - 35, 5, 30, 30);
  } catch (e) {
    console.warn('Could not add logo to PDF:', e);
  }
  
  // Header
  doc.setFillColor(211, 47, 47); // Destructive red for quality
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Qualidade', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Nutrimilho - Produtos Bloqueados e Não Conformidades', 14, 35);
  
  // Date and filters
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  const today = format(new Date(), 'dd/MM/yyyy');
  doc.text(`Gerado em: ${today}`, pageWidth - 50, 50);
  
  if (filters?.dataInicio || filters?.dataFim) {
    const periodo = `Período: ${filters.dataInicio || '-'} até ${filters.dataFim || '-'}`;
    doc.text(periodo, 14, 50);
  }
  
  // Metrics summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores de Qualidade', 14, 65);
  
  // Metrics boxes
  const boxWidth = 58;
  const boxHeight = 25;
  const startY = 70;
  const gap = 6;
  
  const metricsData = [
    { label: 'Qualidade OEE', value: `${metrics.qualidadeOEE.toFixed(1)}%`, color: getQualidadeColor(metrics.qualidadeOEE) },
    { label: 'Total Bloqueado', value: `${metrics.totalBloqueado} kg`, color: [211, 47, 47] as [number, number, number] },
    { label: 'OEE Geral', value: `${metrics.oeeGeral.toFixed(1)}%`, color: getOEEColor(metrics.oeeGeral) },
  ];
  
  metricsData.forEach((metric, index) => {
    const x = 14 + (boxWidth + gap) * index;
    
    doc.setFillColor(...metric.color);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, x + 4, startY + 8);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + 4, startY + 20);
  });
  
  // Distribution by destination
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribuição por Destino', 14, 110);
  
  const destinoData = Object.entries(metrics.porDestino).map(([destino, qtd]) => [destino, `${qtd} kg`]);
  if (destinoData.length > 0) {
    autoTable(doc, {
      startY: 115,
      head: [['Destino', 'Quantidade']],
      body: destinoData,
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      tableWidth: 80,
    });
  }
  
  // Distribution by reason (Pareto)
  const currentY = (doc as any).lastAutoTable?.finalY || 135;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pareto - Motivos de Bloqueio', 14, currentY + 15);
  
  const motivoData = Object.entries(metrics.porMotivo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([motivo, qtd]) => {
      const percentual = metrics.totalBloqueado > 0 ? ((qtd / metrics.totalBloqueado) * 100).toFixed(1) : '0';
      return [motivo, `${qtd} kg`, `${percentual}%`];
    });
  
  if (motivoData.length > 0) {
    autoTable(doc, {
      startY: currentY + 20,
      head: [['Motivo', 'Quantidade', '%']],
      body: motivoData,
      theme: 'striped',
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });
  }
  
  // Products table
  const tableStartY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  
  if (tableStartY > 200) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Produtos Bloqueados', 14, 20);
  } else {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Produtos Bloqueados', 14, tableStartY + 15);
  }
  
  const tableData = produtos.map((p) => [
    p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '-',
    p.turnos?.nome || '-',
    p.equipamentos?.nome || '-',
    p.motivo_bloqueio.substring(0, 30) + (p.motivo_bloqueio.length > 30 ? '...' : ''),
    `${p.quantidade}`,
    p.numero_lacre || '-',
    p.destino,
  ]);
  
  autoTable(doc, {
    startY: tableStartY > 200 ? 25 : tableStartY + 20,
    head: [['Data', 'Turno', 'Segmento', 'Motivo', 'Qtd', 'Lacre', 'Destino']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [211, 47, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [255, 245, 245],
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 45 },
      4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 20 },
      6: { cellWidth: 22 },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 30,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      '© Nutrimilho - Sistema OEE',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Save
  const filename = `relatorio-qualidade-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

const getQualidadeColor = (value: number): [number, number, number] => {
  if (value >= 95) return [46, 125, 50]; // Green
  if (value >= 85) return [249, 168, 37]; // Yellow
  return [211, 47, 47]; // Red
};
interface Parada {
  id: string;
  data: string;
  duracao: number;
  motivo: string;
  categoria: string;
  turnos?: { nome: string } | null;
  equipamentos?: { nome: string } | null;
}

interface ParadasMetrics {
  totalMinutos: number;
  totalParadas: number;
  mediaMinutos: number;
  porCategoria: Record<string, number>;
}

export const exportParadasReport = async (
  paradas: Parada[],
  metrics: ParadasMetrics,
  filters?: { dataInicio?: string; dataFim?: string }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add logo to top-right corner using absolute URL
  try {
    const logoUrl = `${window.location.origin}${logoNutrimilho}`;
    doc.addImage(logoUrl, 'PNG', pageWidth - 35, 5, 30, 30);
  } catch (e) {
    console.warn('Could not add logo to PDF:', e);
  }
  
  // Header
  doc.setFillColor(211, 47, 47); // Red for downtime
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Paradas', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Nutrimilho - Análise de Paradas de Máquina', 14, 35);
  
  // Date and filters
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  const today = format(new Date(), 'dd/MM/yyyy');
  doc.text(`Gerado em: ${today}`, pageWidth - 50, 50);
  
  if (filters?.dataInicio || filters?.dataFim) {
    const periodo = `Período: ${filters.dataInicio || '-'} até ${filters.dataFim || '-'}`;
    doc.text(periodo, 14, 50);
  }
  
  // Metrics summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores de Paradas', 14, 65);
  
  // Metrics boxes
  const boxWidth = 58;
  const boxHeight = 25;
  const startY = 70;
  const gap = 6;
  
  const metricsData = [
    { label: 'Total Minutos', value: `${metrics.totalMinutos} min`, color: [211, 47, 47] as [number, number, number] },
    { label: 'Total Paradas', value: `${metrics.totalParadas}`, color: [249, 168, 37] as [number, number, number] },
    { label: 'Média', value: `${metrics.mediaMinutos.toFixed(1)} min`, color: [100, 100, 100] as [number, number, number] },
  ];
  
  metricsData.forEach((metric, index) => {
    const x = 14 + (boxWidth + gap) * index;
    
    doc.setFillColor(...metric.color);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, x + 4, startY + 8);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + 4, startY + 20);
  });
  
  // Distribution by category
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribuição por Categoria', 14, 110);
  
  const categoriaConfig: Record<string, string> = {
    nao_planejada: 'Não Planejada',
    planejada: 'Planejada',
    manutencao: 'Manutenção',
    setup: 'Setup',
  };
  
  const categoriaData = Object.entries(metrics.porCategoria).map(([cat, minutos]) => [
    categoriaConfig[cat] || cat,
    `${minutos} min`,
  ]);
  
  if (categoriaData.length > 0) {
    autoTable(doc, {
      startY: 115,
      head: [['Categoria', 'Duração']],
      body: categoriaData,
      theme: 'striped',
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      tableWidth: 80,
    });
  }
  
  // Paradas table
  const tableStartY = (doc as any).lastAutoTable?.finalY || 145;
  
  if (tableStartY > 200) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Registro Detalhado de Paradas', 14, 20);
  } else {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Registro Detalhado de Paradas', 14, tableStartY + 15);
  }
  
  const tableData = paradas.map((p) => [
    p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '-',
    p.turnos?.nome || '-',
    p.equipamentos?.nome || '-',
    `${p.duracao} min`,
    p.motivo.substring(0, 35) + (p.motivo.length > 35 ? '...' : ''),
    categoriaConfig[p.categoria] || p.categoria,
  ]);
  
  autoTable(doc, {
    startY: tableStartY > 200 ? 25 : tableStartY + 20,
    head: [['Data', 'Turno', 'Segmento', 'Duração', 'Motivo', 'Categoria']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [211, 47, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [255, 245, 245],
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 60 },
      5: { cellWidth: 30 },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 30,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      '© Nutrimilho - Sistema OEE',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Save
  const filename = `relatorio-paradas-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};