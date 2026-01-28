import { useMemo } from 'react';
import { isAfter, parseISO, startOfDay } from 'date-fns';
import { OPEX } from './useOPEx';

export interface MetricasOPEX {
  pendentes: number;
  emProgresso: number;
  concluidas: number;
  atrasadas: number;
  porDepartamento: {
    departamento: string;
    pendentes: number;
    emProgresso: number;
    concluidas: number;
    atrasadas: number;
    total: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    color: string;
  }[];
}

export const useOPExMetricas = (opexList: OPEX[] | undefined) => {
  const metricas = useMemo(() => {
    if (!opexList) {
      return {
        pendentes: 0,
        emProgresso: 0,
        concluidas: 0,
        atrasadas: 0,
        porDepartamento: [],
        statusDistribution: [],
      };
    }

    const hoje = startOfDay(new Date());
    let pendentes = 0;
    let emProgresso = 0;
    let concluidas = 0;
    let atrasadas = 0;

    const departamentoMap = new Map<
      string,
      { pendentes: number; emProgresso: number; concluidas: number; atrasadas: number; total: number }
    >();

    opexList.forEach((opex) => {
      const isAtrasado = emProgresso && isAfter(hoje, parseISO(opex.data_prevista_termino));

      if (opex.status === 'pendente') pendentes++;
      if (opex.status === 'em_progresso') emProgresso++;
      if (opex.status === 'pronto') concluidas++;
      if (opex.status === 'em_progresso' && isAtrasado) atrasadas++;

      if (!departamentoMap.has(opex.departamento)) {
        departamentoMap.set(opex.departamento, {
          pendentes: 0,
          emProgresso: 0,
          concluidas: 0,
          atrasadas: 0,
          total: 0,
        });
      }

      const dept = departamentoMap.get(opex.departamento)!;
      dept.total++;

      if (opex.status === 'pendente') dept.pendentes++;
      if (opex.status === 'em_progresso') dept.emProgresso++;
      if (opex.status === 'pronto') dept.concluidas++;
      if (opex.status === 'em_progresso' && isAtrasado) dept.atrasadas++;
    });

    const porDepartamento = Array.from(departamentoMap.entries())
      .map(([departamento, dados]) => ({
        departamento,
        ...dados,
      }))
      .sort((a, b) => b.total - a.total);

    const statusDistribution = [
      { status: 'Pendentes', count: pendentes, color: '#fbbf24' },
      { status: 'Em Progresso', count: emProgresso, color: '#60a5fa' },
      { status: 'Concluídas', count: concluidas, color: '#10b981' },
      { status: 'Atrasadas', count: atrasadas, color: '#ef4444' },
    ].filter((s) => s.count > 0);

    return {
      pendentes,
      emProgresso,
      concluidas,
      atrasadas,
      porDepartamento,
      statusDistribution,
    };
  }, [opexList]);

  return metricas;
};
