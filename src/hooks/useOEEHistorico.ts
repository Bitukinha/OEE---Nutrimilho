import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface OEEDiario {
  data: string;
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
}

export interface OEETurnoHistorico {
  turno_id: string;
  turno_nome: string;
  dados: OEEDiario[];
  media_oee: number;
  tendencia: 'up' | 'down' | 'stable';
}

export interface OEEHistoricoData {
  geral: OEEDiario[];
  porTurno: OEETurnoHistorico[];
  melhorTurno: { nome: string; oee: number } | null;
  piorTurno: { nome: string; oee: number } | null;
}

export const useOEEHistorico = (dias: number = 30) => {
  return useQuery({
    queryKey: ['oee_historico', dias],
    queryFn: async (): Promise<OEEHistoricoData> => {
      const dataFim = format(new Date(), 'yyyy-MM-dd'); // Today
      const dataInicio = format(subDays(new Date(), dias), 'yyyy-MM-dd');

      // Buscar turnos
      const { data: turnos, error: turnosError } = await supabase
        .from('turnos')
        .select('id, nome')
        .order('hora_inicio');

      if (turnosError) throw turnosError;

      // Buscar registros de produção no período
      const { data: registros, error: registrosError } = await supabase
        .from('registros_producao')
        .select('*')
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data');

      if (registrosError) throw registrosError;

      // Buscar paradas no período
      const { data: paradas, error: paradasError } = await supabase
        .from('paradas')
        .select('turno_id, duracao, data')
        .gte('data', dataInicio)
        .lte('data', dataFim);

      if (paradasError) throw paradasError;

      // Buscar bloqueados no período
      const { data: bloqueados, error: bloqueadosError } = await supabase
        .from('produtos_bloqueados')
        .select('turno_id, quantidade, data')
        .gte('data', dataInicio)
        .lte('data', dataFim);

      if (bloqueadosError) throw bloqueadosError;

      // Agrupar dados por data
      const dadosPorData: Record<string, {
        registros: typeof registros;
        paradas: number;
        bloqueados: number;
      }> = {};

      registros?.forEach(r => {
        if (!dadosPorData[r.data]) {
          dadosPorData[r.data] = { registros: [], paradas: 0, bloqueados: 0 };
        }
        dadosPorData[r.data].registros.push(r);
      });

      paradas?.forEach(p => {
        if (p.data && dadosPorData[p.data]) {
          dadosPorData[p.data].paradas += p.duracao;
        }
      });

      bloqueados?.forEach(b => {
        if (b.data && dadosPorData[b.data]) {
          dadosPorData[b.data].bloqueados += b.quantidade;
        }
      });

      // Calcular OEE geral por dia
      const oeeGeral: OEEDiario[] = Object.entries(dadosPorData).map(([data, dados]) => {
        const regs = dados.registros;
        if (regs.length === 0) {
          return { data, disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 };
        }

        let totalDisp = 0, totalPerf = 0, totalQual = 0;
        const paradasProp = dados.paradas / regs.length;
        const bloqProp = dados.bloqueados / regs.length;

        regs.forEach(r => {
          const disp = r.tempo_planejado > 0 ? (r.tempo_real / r.tempo_planejado) * 100 : 0;
          const metaKg = r.capacidade_hora || 0;
          const perf = metaKg > 0 ? Math.min((r.total_produzido / metaKg) * 100, 100) : (r.total_produzido > 0 ? 100 : 0);
          const unidadesBoas = Math.max(0, r.total_produzido - r.defeitos - bloqProp);
          const qual = r.total_produzido > 0 ? Math.max(0, (unidadesBoas / r.total_produzido) * 100) : 0;

          totalDisp += disp;
          totalPerf += perf;
          totalQual += qual;
        });

        const avgDisp = totalDisp / regs.length;
        const avgPerf = totalPerf / regs.length;
        const avgQual = totalQual / regs.length;
        const oee = (avgDisp * avgPerf * avgQual) / 10000;

        return {
          data,
          disponibilidade: Number(avgDisp.toFixed(1)),
          performance: Number(avgPerf.toFixed(1)),
          qualidade: Number(avgQual.toFixed(1)),
          oee: Number(oee.toFixed(1)),
        };
      }).sort((a, b) => a.data.localeCompare(b.data));

      // Calcular OEE por turno
      const oeePorTurno: OEETurnoHistorico[] = turnos?.map(turno => {
        const dadosTurno: OEEDiario[] = [];

        Object.entries(dadosPorData).forEach(([data, dados]) => {
          const regsTurno = dados.registros.filter(r => r.turno_id === turno.id);
          if (regsTurno.length === 0) return;

          const paradasTurno = paradas?.filter(p => p.data === data && p.turno_id === turno.id)
            .reduce((acc, p) => acc + p.duracao, 0) || 0;
          const bloqTurno = bloqueados?.filter(b => b.data === data && b.turno_id === turno.id)
            .reduce((acc, b) => acc + b.quantidade, 0) || 0;

          let totalDisp = 0, totalPerf = 0, totalQual = 0;
          const paradasProp = paradasTurno / regsTurno.length;
          const bloqProp = bloqTurno / regsTurno.length;

          regsTurno.forEach(r => {
            const disp = r.tempo_planejado > 0 ? (r.tempo_real / r.tempo_planejado) * 100 : 0;
            const metaKg = r.capacidade_hora || 0;
            const perf = metaKg > 0 ? Math.min((r.total_produzido / metaKg) * 100, 100) : (r.total_produzido > 0 ? 100 : 0);
            const unidadesBoas = Math.max(0, r.total_produzido - r.defeitos - bloqProp);
            const qual = r.total_produzido > 0 ? Math.max(0, (unidadesBoas / r.total_produzido) * 100) : 0;

            totalDisp += disp;
            totalPerf += perf;
            totalQual += qual;
          });

          const avgDisp = totalDisp / regsTurno.length;
          const avgPerf = totalPerf / regsTurno.length;
          const avgQual = totalQual / regsTurno.length;
          const oee = (avgDisp * avgPerf * avgQual) / 10000;

          dadosTurno.push({
            data,
            disponibilidade: Number(avgDisp.toFixed(1)),
            performance: Number(avgPerf.toFixed(1)),
            qualidade: Number(avgQual.toFixed(1)),
            oee: Number(oee.toFixed(1)),
          });
        });

        dadosTurno.sort((a, b) => a.data.localeCompare(b.data));

        // Calcular média e tendência
        const mediaOee = dadosTurno.length > 0
          ? dadosTurno.reduce((acc, d) => acc + d.oee, 0) / dadosTurno.length
          : 0;

        // Tendência: comparar primeira e segunda metade
        let tendencia: 'up' | 'down' | 'stable' = 'stable';
        if (dadosTurno.length >= 4) {
          const metade = Math.floor(dadosTurno.length / 2);
          const primeiraMet = dadosTurno.slice(0, metade).reduce((acc, d) => acc + d.oee, 0) / metade;
          const segundaMet = dadosTurno.slice(metade).reduce((acc, d) => acc + d.oee, 0) / (dadosTurno.length - metade);
          if (segundaMet > primeiraMet + 2) tendencia = 'up';
          else if (segundaMet < primeiraMet - 2) tendencia = 'down';
        }

        return {
          turno_id: turno.id,
          turno_nome: turno.nome,
          dados: dadosTurno,
          media_oee: Number(mediaOee.toFixed(1)),
          tendencia,
        };
      }) || [];

      // Encontrar melhor e pior turno
      const turnosComDados = oeePorTurno.filter(t => t.dados.length > 0);
      const melhorTurno = turnosComDados.length > 0
        ? turnosComDados.reduce((best, t) => t.media_oee > best.media_oee ? t : best)
        : null;
      const piorTurno = turnosComDados.length > 0
        ? turnosComDados.reduce((worst, t) => t.media_oee < worst.media_oee ? t : worst)
        : null;

      return {
        geral: oeeGeral,
        porTurno: oeePorTurno,
        melhorTurno: melhorTurno ? { nome: melhorTurno.turno_nome, oee: melhorTurno.media_oee } : null,
        piorTurno: piorTurno ? { nome: piorTurno.turno_nome, oee: piorTurno.media_oee } : null,
      };
    },
  });
};
