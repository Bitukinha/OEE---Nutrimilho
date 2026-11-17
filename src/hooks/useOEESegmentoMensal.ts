import { useQuery } from '@tanstack/react-query';
import { format, endOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  calcularOEESegmentos,
  REGISTRO_SEGMENTO_SELECT,
  type OEESegmento,
  type RegistroSegmento,
  type ParadaSegmento,
  type BloqueadoSegmento,
} from '@/hooks/useOEEPorSegmento';

export interface OEESegmentoMes {
  /** yyyy-MM */
  mes: string;
  segmentos: OEESegmento[];
}

export interface OEESegmentoMensalData {
  /** Meses em ordem cronológica (do mais antigo ao mês escolhido) */
  meses: OEESegmentoMes[];
  /** Todos os equipamentos que aparecem em algum dos meses */
  equipamentos: { id: string; nome: string }[];
}

const PAGE_SIZE = 1000;

// Busca todas as linhas do período, paginando para não esbarrar no limite padrão do Supabase.
async function buscarTudo<T>(
  tabela: 'registros_producao' | 'paradas' | 'produtos_bloqueados',
  colunas: string,
  inicio: string,
  fim: string,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(tabela)
      .select(colunas)
      .gte('data', inicio)
      .lte('data', fim)
      .order('id')
      .range(de, de + PAGE_SIZE - 1);
    if (error) throw error;
    linhas.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return linhas;
}

/**
 * OEE por segmento (equipamento) mês a mês.
 * @param mesFinal mês escolhido no formato yyyy-MM
 * @param quantidadeMeses quantos meses mostrar, terminando em mesFinal
 */
export const useOEESegmentoMensal = (mesFinal: string, quantidadeMeses = 6) => {
  return useQuery({
    queryKey: ['oee_segmento_mensal', mesFinal, quantidadeMeses],
    queryFn: async (): Promise<OEESegmentoMensalData> => {
      const [ano, mes] = mesFinal.split('-').map(Number);
      const ultimoMes = new Date(ano, mes - 1, 1);
      const primeiroMes = subMonths(ultimoMes, quantidadeMeses - 1);
      const inicio = format(primeiroMes, 'yyyy-MM-dd');
      const fim = format(endOfMonth(ultimoMes), 'yyyy-MM-dd');

      const [registros, paradas, bloqueados] = await Promise.all([
        buscarTudo<RegistroSegmento & { data: string }>('registros_producao', REGISTRO_SEGMENTO_SELECT, inicio, fim),
        buscarTudo<ParadaSegmento & { data: string }>('paradas', 'id, registro_id, duracao, equipamento_id, data', inicio, fim),
        buscarTudo<BloqueadoSegmento & { data: string }>('produtos_bloqueados', 'id, equipamento_id, quantidade, data', inicio, fim),
      ]);

      const doMes = <T extends { data: string }>(linhas: T[], m: string) =>
        linhas.filter(l => l.data?.slice(0, 7) === m);

      const meses: OEESegmentoMes[] = [];
      for (let i = 0; i < quantidadeMeses; i++) {
        const m = format(subMonths(ultimoMes, quantidadeMeses - 1 - i), 'yyyy-MM');
        meses.push({
          mes: m,
          segmentos: calcularOEESegmentos(doMes(registros, m), doMes(paradas, m), doMes(bloqueados, m)),
        });
      }

      const equipamentosMap = new Map<string, string>();
      meses.forEach(m => m.segmentos.forEach(s => equipamentosMap.set(s.equipamento_id, s.equipamento_nome)));
      const equipamentos = [...equipamentosMap.entries()]
        .map(([id, nome]) => ({ id, nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      return { meses, equipamentos };
    },
  });
};
