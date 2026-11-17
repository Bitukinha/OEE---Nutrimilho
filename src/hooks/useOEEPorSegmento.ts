import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calcularDisponibilidadeComParadas, calcularTempoPlanejadoTurnoMinutos } from '@/lib/dateUtils';

export interface OEESegmento {
  equipamento_id: string;
  equipamento_nome: string;
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
  total_registros: number;
  total_produzido: number;
}

export interface OEESegmentoData {
  segmentos: OEESegmento[];
}

export interface RegistroSegmento {
  id: string;
  equipamento_id: string;
  tempo_planejado: number | null;
  capacidade_hora: number | null;
  total_produzido: number | null;
  equipamentos?: { id: string; nome: string } | null;
  turnos?: { hora_inicio?: string; hora_fim?: string } | null;
}

/** Colunas que o cálculo por segmento precisa de registros_producao */
export const REGISTRO_SEGMENTO_SELECT = '*, equipamentos(id, nome), turnos(hora_inicio, hora_fim)';

export interface ParadaSegmento {
  registro_id: string | null;
  duracao: number | null;
  equipamento_id: string | null;
}

export interface BloqueadoSegmento {
  equipamento_id: string | null;
  quantidade: number | null;
}

/** Calcula D, P, Q e OEE por equipamento a partir dos registros, paradas e bloqueios de um período. */
export const calcularOEESegmentos = (
  registros: RegistroSegmento[],
  paradas: ParadaSegmento[],
  bloqueados: BloqueadoSegmento[],
): OEESegmento[] => {
  // Agrupar paradas por registro
  const paradasPorRegistro: Record<string, number> = {};
  paradas.forEach(p => {
    if (p.registro_id) {
      paradasPorRegistro[p.registro_id] = (paradasPorRegistro[p.registro_id] || 0) + (p.duracao || 0);
    }
  });

  // Agrupar bloqueados por equipamento
  const bloqueadosPorEquipamento: Record<string, number> = {};
  bloqueados.forEach(b => {
    if (b.equipamento_id) {
      bloqueadosPorEquipamento[b.equipamento_id] = (bloqueadosPorEquipamento[b.equipamento_id] || 0) + (b.quantidade || 0);
    }
  });

  // Agrupar registros por equipamento
  const dadosPorEquipamento: Record<string, { registros: RegistroSegmento[]; equipamento_nome: string }> = {};
  registros.forEach(r => {
    const equipId = r.equipamento_id;
    if (!dadosPorEquipamento[equipId]) {
      dadosPorEquipamento[equipId] = {
        registros: [],
        equipamento_nome: r.equipamentos?.nome || 'Desconhecido',
      };
    }
    dadosPorEquipamento[equipId].registros.push(r);
  });

  const segmentos: OEESegmento[] = Object.entries(dadosPorEquipamento).map(([equipId, dados]) => {
    const regs = dados.registros;

    let totalDisp = 0;
    let totalPerf = 0;
    let totalQual = 0;
    let totalProduzido = 0;

    regs.forEach(r => {
      // Mesmo critério do OEE por turno/Histórico:
      // Disponibilidade = (tempo planejado do turno - paradas do registro) / tempo planejado
      const turno = r.turnos ?? null;
      const tempoPlanejado = turno?.hora_inicio && turno?.hora_fim
        ? calcularTempoPlanejadoTurnoMinutos(turno.hora_inicio, turno.hora_fim)
        : Number(r.tempo_planejado || 0);
      const disp = calcularDisponibilidadeComParadas(tempoPlanejado, paradasPorRegistro[r.id] || 0);

      // Performance = produzido / meta em kg do registro (capacidade_hora)
      const unidadesReais = r.total_produzido || 0;
      const metaKg = r.capacidade_hora || 0;
      const perf = metaKg > 0 ? Math.min((unidadesReais / metaKg) * 100, 100) : (unidadesReais > 0 ? 100 : 0);

      // Qualidade só é afetada por produtos bloqueados (não por defeitos manuais)
      const bloqProp = (bloqueadosPorEquipamento[equipId] || 0) / regs.length;
      const unidadesBoas = Math.max(0, unidadesReais - bloqProp);
      const qual = unidadesReais > 0 ? (unidadesBoas / unidadesReais) * 100 : 100;

      totalDisp += disp;
      totalPerf += perf;
      totalQual += qual;
      totalProduzido += unidadesReais;
    });

    const avgDisp = totalDisp / regs.length;
    const avgPerf = totalPerf / regs.length;
    const avgQual = totalQual / regs.length;
    const oee = (avgDisp * avgPerf * avgQual) / 10000;

    return {
      equipamento_id: equipId,
      equipamento_nome: dados.equipamento_nome,
      disponibilidade: Number(avgDisp.toFixed(1)),
      performance: Number(avgPerf.toFixed(1)),
      qualidade: Number(avgQual.toFixed(1)),
      oee: Number(oee.toFixed(1)),
      total_registros: regs.length,
      total_produzido: Math.round(totalProduzido),
    };
  });

  // Ordenar por OEE descendente
  segmentos.sort((a, b) => b.oee - a.oee);
  return segmentos;
};

export const useOEEPorSegmento = (dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ['oee_por_segmento', dataInicio, dataFim],
    queryFn: async (): Promise<OEESegmentoData> => {
      try {
        // Buscar registros de produção
        let registrosQuery = supabase
          .from('registros_producao')
          .select(REGISTRO_SEGMENTO_SELECT);

        if (dataInicio) {
          registrosQuery = registrosQuery.gte('data', dataInicio);
        }
        if (dataFim) {
          registrosQuery = registrosQuery.lte('data', dataFim);
        }

        const { data: registros, error: registrosError } = await registrosQuery;
        if (registrosError) throw registrosError;

        // Buscar paradas
        let paradasQuery = supabase
          .from('paradas')
          .select('id, registro_id, duracao, equipamento_id');

        if (dataInicio) {
          paradasQuery = paradasQuery.gte('data', dataInicio);
        }
        if (dataFim) {
          paradasQuery = paradasQuery.lte('data', dataFim);
        }

        const { data: paradas, error: paradasError } = await paradasQuery;
        if (paradasError) throw paradasError;

        // Buscar produtos bloqueados
        let bloqueadosQuery = supabase
          .from('produtos_bloqueados')
          .select('id, equipamento_id, quantidade');

        if (dataInicio) {
          bloqueadosQuery = bloqueadosQuery.gte('data', dataInicio);
        }
        if (dataFim) {
          bloqueadosQuery = bloqueadosQuery.lte('data', dataFim);
        }

        const { data: bloqueados, error: bloqueadosError } = await bloqueadosQuery;
        if (bloqueadosError) throw bloqueadosError;

        const segmentos = calcularOEESegmentos(
          (registros || []) as RegistroSegmento[],
          paradas || [],
          bloqueados || [],
        );

        return { segmentos };
      } catch (error) {
        console.error('Erro ao buscar OEE por segmento:', error);
        throw error;
      }
    },
  });
};
