import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useOEEPorSegmento = (dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ['oee_por_segmento', dataInicio, dataFim],
    queryFn: async () => {
      try {
        // Buscar registros de produção
        let registrosQuery = supabase
          .from('registros_producao')
          .select('*, equipamentos(id, nome)');

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

        // Agrupar paradas por equipamento e por registro
        const paradasPorEquipamento: Record<string, number> = {};
        const paradasPorRegistro: Record<string, number> = {};
        paradas?.forEach(p => {
          if (p.equipamento_id) {
            paradasPorEquipamento[p.equipamento_id] = (paradasPorEquipamento[p.equipamento_id] || 0) + (p.duracao || 0);
          }
          if (p.registro_id) {
            paradasPorRegistro[p.registro_id] = (paradasPorRegistro[p.registro_id] || 0) + (p.duracao || 0);
          }
        });

        // Agrupar bloqueados por equipamento
        const bloqueadosPorEquipamento: Record<string, number> = {};
        bloqueados?.forEach(b => {
          if (b.equipamento_id) {
            bloqueadosPorEquipamento[b.equipamento_id] = (bloqueadosPorEquipamento[b.equipamento_id] || 0) + (b.quantidade || 0);
          }
        });

        // Agrupar dados por equipamento
        const dadosPorEquipamento: Record<string, {
          registros: typeof registros;
          equipamento_nome: string;
        }> = {};

        registros?.forEach(r => {
          const equipId = r.equipamento_id;
          if (!dadosPorEquipamento[equipId]) {
            dadosPorEquipamento[equipId] = {
              registros: [],
              equipamento_nome: r.equipamentos?.nome || 'Desconhecido',
            };
          }
          dadosPorEquipamento[equipId].registros.push(r);
        });

        // Calcular OEE por equipamento
        const TEMPO_TURNO = 720; // 720 minutos por turno

        const segmentos: OEESegmento[] = Object.entries(dadosPorEquipamento).map(
          ([equipId, dados]) => {
            const regs = dados.registros;

            if (regs.length === 0) {
              return {
                equipamento_id: equipId,
                equipamento_nome: dados.equipamento_nome,
                disponibilidade: 0,
                performance: 0,
                qualidade: 0,
                oee: 0,
                total_registros: 0,
                total_produzido: 0,
              };
            }

            // Calcular métricas para o equipamento
            let totalDisp = 0;
            let totalPerf = 0;
            let totalQual = 0;
            let totalProduzido = 0;

            regs.forEach(r => {
              const tempoParadasReg = paradasPorRegistro[r.id] || 0;
              const tempoReal = r.tempo_real || 0;
              const tempoRealAjustado = Math.max(0, tempoReal - tempoParadasReg);

              // Disponibilidade
              const disp = (tempoRealAjustado / TEMPO_TURNO) * 100;

              // Performance (tempo ciclo real vs ideal)
              const unidadesIdeais = r.tempo_ciclo_ideal > 0
                ? (tempoReal / r.tempo_ciclo_ideal) * 60
                : 0;
              const unidadesReais = r.total_produzido || 0;
              const perf = unidadesIdeais > 0 ? (unidadesReais / unidadesIdeais) * 100 : 0;

              // Qualidade
              const bloqProp = regs.length > 0 ? (bloqueadosPorEquipamento[equipId] || 0) / regs.length : 0;
              const unidadesBoas = Math.max(0, unidadesReais - (r.defeitos || 0) - bloqProp);
              const qual = unidadesReais > 0 ? (unidadesBoas / unidadesReais) * 100 : 0;

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
          }
        );

        // Ordenar por OEE descendente
        segmentos.sort((a, b) => b.oee - a.oee);

        return { segmentos };
      } catch (error) {
        console.error('Erro ao buscar OEE por segmento:', error);
        throw error;
      }
    },
  });
};
