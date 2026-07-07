import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calcularDisponibilidadeComParadas, calcularTempoPlanejadoTurnoMinutos } from '@/lib/dateUtils';

export interface OEETurno {
  turno_id: string;
  turno_nome: string;
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
  total_registros: number;
  total_paradas_min: number;
  meta_oee: number;
}

export interface OEEGeral {
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
}

const emptyResult = () => ({
  porTurno: [] as OEETurno[],
  geral: { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 },
});

export const useOEEPorTurno = (dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ['oee_por_turno', dataInicio, dataFim],
    queryFn: async () => {
      try {
        // Buscar todos os turnos
        const { data: turnos, error: turnosError } = await supabase
          .from('turnos')
          .select('id, nome, meta_oee, hora_inicio, hora_fim')
          .order('hora_inicio');

        if (turnosError) {
          console.warn('OEE: erro ao buscar turnos', turnosError);
          return emptyResult();
        }

      // Buscar registros de produção
      let registrosQuery = supabase
        .from('registros_producao')
        .select('*, turnos (id, nome, hora_inicio, hora_fim)');

      if (dataInicio) {
        registrosQuery = registrosQuery.gte('data', dataInicio);
      }
      if (dataFim) {
        registrosQuery = registrosQuery.lte('data', dataFim);
      }

        const { data: registros, error: registrosError } = await registrosQuery;
        if (registrosError) {
          console.warn('OEE: erro ao buscar registros', registrosError);
          return emptyResult();
        }

      // Buscar paradas (incluir registro_id para associar por registro)
      let paradasQuery = supabase
        .from('paradas')
        .select('id, registro_id, turno_id, duracao');

      if (dataInicio) {
        paradasQuery = paradasQuery.gte('data', dataInicio);
      }
      if (dataFim) {
        paradasQuery = paradasQuery.lte('data', dataFim);
      }

        const { data: paradas, error: paradasError } = await paradasQuery;
        if (paradasError) {
          console.warn('OEE: erro ao buscar paradas', paradasError);
          return emptyResult();
        }

      // Buscar produtos bloqueados
      let bloqueadosQuery = supabase
        .from('produtos_bloqueados')
        .select('turno_id, quantidade');

      if (dataInicio) {
        bloqueadosQuery = bloqueadosQuery.gte('data', dataInicio);
      }
      if (dataFim) {
        bloqueadosQuery = bloqueadosQuery.lte('data', dataFim);
      }

        const { data: bloqueados, error: bloqueadosError } = await bloqueadosQuery;
        if (bloqueadosError) {
          console.warn('OEE: erro ao buscar bloqueados', bloqueadosError);
          return emptyResult();
        }

      // Agrupar paradas por turno e por registro
      const paradasPorTurno: Record<string, number> = {};
      const paradasPorRegistro: Record<string, number> = {};
      paradas?.forEach(p => {
        if (p.turno_id) {
          paradasPorTurno[p.turno_id] = (paradasPorTurno[p.turno_id] || 0) + (p.duracao || 0);
        }
        if (p.registro_id) {
          paradasPorRegistro[p.registro_id] = (paradasPorRegistro[p.registro_id] || 0) + (p.duracao || 0);
        }
      });

      // Agrupar bloqueados por turno
      const bloqueadosPorTurno: Record<string, number> = {};
      bloqueados?.forEach(b => {
        if (b.turno_id) {
          bloqueadosPorTurno[b.turno_id] = (bloqueadosPorTurno[b.turno_id] || 0) + b.quantidade;
        }
      });

      // Calcular OEE por turno
      const oeePorTurno: OEETurno[] = turnos?.map(turno => {
        const registrosTurno = registros?.filter(r => r.turno_id === turno.id) || [];
        const totalParadas = paradasPorTurno[turno.id] || 0;
        const totalBloqueados = bloqueadosPorTurno[turno.id] || 0;
        
        if (registrosTurno.length === 0) {
          return {
            turno_id: turno.id,
            turno_nome: turno.nome,
            disponibilidade: 0,
            performance: 0,
            qualidade: 0,
            oee: 0,
            total_registros: 0,
            total_paradas_min: totalParadas,
            meta_oee: turno.meta_oee || 85,
          };
        }

        // Calcular métricas agregadas
        let totalDisponibilidade = 0;
        let totalPerformance = 0;
        let totalQualidade = 0;

        // Bloqueados proporcional por registro do turno
        const bloqueadosProporcional = totalBloqueados / registrosTurno.length;

        registrosTurno.forEach(registro => {
          // Somar as paradas deste registro (se existirem)
          const paradasSumRegistro = paradasPorRegistro[registro.id] || 0;
          const turno = (registro.turnos as { hora_inicio?: string; hora_fim?: string } | null) ?? null;
          const tempoPlanejado = turno?.hora_inicio && turno?.hora_fim
            ? calcularTempoPlanejadoTurnoMinutos(turno.hora_inicio, turno.hora_fim)
            : Number(registro.tempo_planejado || 0);

          // Disponibilidade = (Tempo Planejado - Paradas) / Tempo Planejado
          const disponibilidade = calcularDisponibilidadeComParadas(tempoPlanejado, paradasSumRegistro);
          
          // Performance agora baseada na meta em kg informada no registro (`capacidade_hora` foi repurposed como "metaKg").
          // Se a meta for zero/ausente, considerar performance 100% se produziu >0.
          const metaKg = registro.capacidade_hora || 0;
          const performance = metaKg > 0
            ? Math.min(100, (registro.total_produzido / metaKg) * 100)
            : (registro.total_produzido > 0 ? 100 : 0);
          
          // Qualidade = (Total - Bloqueados) / Total Produzido — só bloqueios afetam a qualidade/OEE.
          // Sem produção no registro não há base para penalizar a qualidade (fica neutra em 100%).
          const unidadesBoas = Math.max(0, registro.total_produzido - bloqueadosProporcional);
          const qualidade = registro.total_produzido > 0
            ? (unidadesBoas / registro.total_produzido) * 100
            : 100;

          totalDisponibilidade += disponibilidade;
          totalPerformance += Math.min(performance, 100); // Cap at 100%
          totalQualidade += Math.max(0, qualidade); // Não permitir negativo
        });

        const avgDisponibilidade = totalDisponibilidade / registrosTurno.length;
        const avgPerformance = totalPerformance / registrosTurno.length;
        const avgQualidade = totalQualidade / registrosTurno.length;
        const oee = (avgDisponibilidade * avgPerformance * avgQualidade) / 10000;

        return {
          turno_id: turno.id,
          turno_nome: turno.nome,
          disponibilidade: Number(avgDisponibilidade.toFixed(1)),
          performance: Number(avgPerformance.toFixed(1)),
          qualidade: Number(avgQualidade.toFixed(1)),
          oee: Number(oee.toFixed(1)),
          total_registros: registrosTurno.length,
          total_paradas_min: totalParadas,
          meta_oee: turno.meta_oee || 85,
        };
      }) || [];

      // Calcular OEE Geral (média ponderada por número de registros)
      const turnosComRegistros = oeePorTurno.filter(t => t.total_registros > 0);
      const totalRegistros = turnosComRegistros.reduce((acc, t) => acc + t.total_registros, 0);

      const oeeGeral: OEEGeral = totalRegistros > 0 ? {
        disponibilidade: Number((turnosComRegistros.reduce((acc, t) => 
          acc + t.disponibilidade * t.total_registros, 0) / totalRegistros).toFixed(1)),
        performance: Number((turnosComRegistros.reduce((acc, t) => 
          acc + t.performance * t.total_registros, 0) / totalRegistros).toFixed(1)),
        qualidade: Number((turnosComRegistros.reduce((acc, t) => 
          acc + t.qualidade * t.total_registros, 0) / totalRegistros).toFixed(1)),
        oee: Number((turnosComRegistros.reduce((acc, t) => 
          acc + t.oee * t.total_registros, 0) / totalRegistros).toFixed(1)),
      } : { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 };

        return {
          porTurno: oeePorTurno,
          geral: oeeGeral,
        };
      } catch (err) {
        console.warn('OEE: falha ao carregar dados', err);
        return emptyResult();
      }
    },
  });
};
