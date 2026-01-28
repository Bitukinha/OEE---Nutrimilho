import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, format, parseISO } from 'date-fns';

export interface OEEPeriodo {
  periodo: string;
  data_inicio: string;
  data_fim: string;
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
}

export interface OEESegmentoPeriodo {
  equipamento_id: string;
  equipamento_nome: string;
  periodos: OEEPeriodo[];
}

export interface OEEPeriodosData {
  geral: OEEPeriodo[];
  porSegmento: OEESegmentoPeriodo[];
}

const TEMPO_TURNO = 720; // 720 minutos por turno

interface RegistroProducao {
  id: string;
  data: string;
  equipamento_id: string;
  tempo_real: number;
  tempo_ciclo_ideal: number;
  total_produzido: number;
  defeitos: number;
  equipamentos?: { id: string; nome: string } | null;
}

interface Parada {
  id: string;
  registro_id?: string;
  duracao: number;
}

interface OEEResult {
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
}

const calculateOEE = (registros: RegistroProducao[], paradas: Parada[]): OEEResult => {
  if (registros.length === 0) {
    return {
      disponibilidade: 0,
      performance: 0,
      qualidade: 0,
      oee: 0,
    };
  }

  // Agrupar paradas por registro
  const paradasPorRegistro: Record<string, number> = {};
  paradas?.forEach(p => {
    if (p.registro_id) {
      paradasPorRegistro[p.registro_id] = (paradasPorRegistro[p.registro_id] || 0) + (p.duracao || 0);
    }
  });

  let totalDisp = 0;
  let totalPerf = 0;
  let totalQual = 0;

  registros.forEach(r => {
    const tempoParadasReg = paradasPorRegistro[r.id] || 0;
    const tempoReal = r.tempo_real || 0;
    const tempoRealAjustado = Math.max(0, tempoReal - tempoParadasReg);

    // Disponibilidade
    const disp = (tempoRealAjustado / TEMPO_TURNO) * 100;

    // Performance
    const unidadesIdeais = r.tempo_ciclo_ideal > 0
      ? (tempoReal / r.tempo_ciclo_ideal) * 60
      : 0;
    const unidadesReais = r.total_produzido || 0;
    const perf = unidadesIdeais > 0 ? (unidadesReais / unidadesIdeais) * 100 : 0;

    // Qualidade
    const unidadesBoas = Math.max(0, unidadesReais - (r.defeitos || 0));
    const qual = unidadesReais > 0 ? (unidadesBoas / unidadesReais) * 100 : 0;

    totalDisp += disp;
    totalPerf += perf;
    totalQual += qual;
  });

  const avgDisp = totalDisp / registros.length;
  const avgPerf = totalPerf / registros.length;
  const avgQual = totalQual / registros.length;
  const oee = (avgDisp * avgPerf * avgQual) / 10000;

  return {
    disponibilidade: Number(avgDisp.toFixed(1)),
    performance: Number(avgPerf.toFixed(1)),
    qualidade: Number(avgQual.toFixed(1)),
    oee: Number(oee.toFixed(1)),
  };
};

export const useOEEPeriodos = () => {
  return useQuery({
    queryKey: ['oee_periodos'],
    queryFn: async () => {
      try {
        const hoje = new Date();

        // Datas para cada período
        const periodos = [
          // Últimas 4 semanas
          { tipo: 'semana', label: 'Semana Atual', inicio: startOfWeek(hoje), fim: endOfWeek(hoje) },
          { tipo: 'semana', label: 'Semana -1', inicio: startOfWeek(subWeeks(hoje, 1)), fim: endOfWeek(subWeeks(hoje, 1)) },
          { tipo: 'semana', label: 'Semana -2', inicio: startOfWeek(subWeeks(hoje, 2)), fim: endOfWeek(subWeeks(hoje, 2)) },
          { tipo: 'semana', label: 'Semana -3', inicio: startOfWeek(subWeeks(hoje, 3)), fim: endOfWeek(subWeeks(hoje, 3)) },

          // Últimos 12 meses
          { tipo: 'mes', label: 'Mês Atual', inicio: startOfMonth(hoje), fim: endOfMonth(hoje) },
          { tipo: 'mes', label: 'Mês -1', inicio: startOfMonth(subMonths(hoje, 1)), fim: endOfMonth(subMonths(hoje, 1)) },
          { tipo: 'mes', label: 'Mês -2', inicio: startOfMonth(subMonths(hoje, 2)), fim: endOfMonth(subMonths(hoje, 2)) },
          { tipo: 'mes', label: 'Mês -3', inicio: startOfMonth(subMonths(hoje, 3)), fim: endOfMonth(subMonths(hoje, 3)) },
          { tipo: 'mes', label: 'Mês -4', inicio: startOfMonth(subMonths(hoje, 4)), fim: endOfMonth(subMonths(hoje, 4)) },
          { tipo: 'mes', label: 'Mês -5', inicio: startOfMonth(subMonths(hoje, 5)), fim: endOfMonth(subMonths(hoje, 5)) },
          { tipo: 'mes', label: 'Mês -6', inicio: startOfMonth(subMonths(hoje, 6)), fim: endOfMonth(subMonths(hoje, 6)) },
          { tipo: 'mes', label: 'Mês -7', inicio: startOfMonth(subMonths(hoje, 7)), fim: endOfMonth(subMonths(hoje, 7)) },
          { tipo: 'mes', label: 'Mês -8', inicio: startOfMonth(subMonths(hoje, 8)), fim: endOfMonth(subMonths(hoje, 8)) },
          { tipo: 'mes', label: 'Mês -9', inicio: startOfMonth(subMonths(hoje, 9)), fim: endOfMonth(subMonths(hoje, 9)) },
          { tipo: 'mes', label: 'Mês -10', inicio: startOfMonth(subMonths(hoje, 10)), fim: endOfMonth(subMonths(hoje, 10)) },
          { tipo: 'mes', label: 'Mês -11', inicio: startOfMonth(subMonths(hoje, 11)), fim: endOfMonth(subMonths(hoje, 11)) },

          // Ano
          { tipo: 'ano', label: 'Ano Atual', inicio: startOfYear(hoje), fim: endOfYear(hoje) },
          { tipo: 'ano', label: 'Ano -1', inicio: startOfYear(subMonths(hoje, 12)), fim: endOfYear(subMonths(hoje, 12)) },
        ];

        // Buscar todos os registros (sem limites de data inicialmente)
        const { data: allRegistros, error: registrosError } = await supabase
          .from('registros_producao')
          .select('*, equipamentos(id, nome)');

        if (registrosError) throw registrosError;

        const { data: allParadas, error: paradasError } = await supabase
          .from('paradas')
          .select('id, registro_id, duracao, equipamento_id');

        if (paradasError) throw paradasError;

        // Processar dados por período
        const resultPeriodos: Record<string, OEEPeriodo[]> = {
          semana: [],
          mes: [],
          ano: [],
        };

        const resultSegmentos: Record<string, OEESegmentoPeriodo> = {};

        periodos.forEach(periodo => {
          const dataInicio = format(periodo.inicio, 'yyyy-MM-dd');
          const dataFim = format(periodo.fim, 'yyyy-MM-dd');

          // Filtrar registros do período
          const regsPerido = allRegistros?.filter(r => {
            const rData = r.data;
            return rData >= dataInicio && rData <= dataFim;
          }) || [];

          // Filtrar paradas do período
          const paradasPeriodo = allParadas?.filter(p => {
            const rData = regsPerido.find(r => r.id === p.registro_id)?.data;
            return rData && rData >= dataInicio && rData <= dataFim;
          }) || [];

          // Calcular OEE geral
          const oeeGeral = calculateOEE(regsPerido, paradasPeriodo);

          resultPeriodos[periodo.tipo].push({
            periodo: periodo.label,
            data_inicio: dataInicio,
            data_fim: dataFim,
            ...oeeGeral,
          });

          // Calcular OEE por segmento
          const equipamentosUnicos = new Set(regsPerido.map(r => r.equipamento_id));
          equipamentosUnicos.forEach(equipId => {
            if (!resultSegmentos[equipId]) {
              const equipNome = regsPerido.find(r => r.equipamento_id === equipId)?.equipamentos?.nome || 'Desconhecido';
              resultSegmentos[equipId] = {
                equipamento_id: equipId,
                equipamento_nome: equipNome,
                periodos: [],
              };
            }

            const regsEquip = regsPerido.filter(r => r.equipamento_id === equipId);
            const paradasEquip = paradasPeriodo.filter(p => {
              const reg = regsPerido.find(r => r.id === p.registro_id);
              return reg && reg.equipamento_id === equipId;
            });

            const oeeEquip = calculateOEE(regsEquip, paradasEquip);
            resultSegmentos[equipId].periodos.push({
              periodo: periodo.label,
              data_inicio: dataInicio,
              data_fim: dataFim,
              ...oeeEquip,
            });
          });
        });

        // Ordenar períodos
        const ordenarPeriodos = (tipo: string) => {
          const semanas = ['Semana Atual', 'Semana -1', 'Semana -2', 'Semana -3'];
          const meses = ['Mês Atual', 'Mês -1', 'Mês -2', 'Mês -3', 'Mês -4', 'Mês -5', 'Mês -6', 'Mês -7', 'Mês -8', 'Mês -9', 'Mês -10', 'Mês -11'];
          const anos = ['Ano Atual', 'Ano -1'];

          const ordem = tipo === 'semana' ? semanas : tipo === 'mes' ? meses : anos;
          return resultPeriodos[tipo].sort((a, b) => ordem.indexOf(a.periodo) - ordem.indexOf(b.periodo));
        };

        return {
          geral: [
            ...ordenarPeriodos('semana'),
            ...ordenarPeriodos('mes'),
            ...ordenarPeriodos('ano'),
          ],
          porSegmento: Object.values(resultSegmentos).sort((a, b) => {
            // Calcular OEE médio para ordenar
            const mediaA = a.periodos.length > 0 ? a.periodos.reduce((acc, p) => acc + p.oee, 0) / a.periodos.length : 0;
            const mediaB = b.periodos.length > 0 ? b.periodos.reduce((acc, p) => acc + p.oee, 0) / b.periodos.length : 0;
            return mediaB - mediaA;
          }),
        };
      } catch (error) {
        console.error('Erro ao buscar OEE por períodos:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};
