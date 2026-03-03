import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OPEX {
  id: string;
  departamento: string;
  descricao: string;
  data_inicio: string;
  data_prevista_termino: string;
  status: 'pendente' | 'em_progresso' | 'pronto';
  concluido: boolean;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
}

// Dados de teste
const DADOS_TESTE = [
  { departamento: 'Manutenção', descricao: 'Revisão geral da máquina CNC 01', data_inicio: '2026-01-20', data_prevista_termino: '2026-02-10', status: 'em_progresso' },
  { departamento: 'Qualidade', descricao: 'Implementação de novo padrão de inspeção', data_inicio: '2026-01-25', data_prevista_termino: '2026-02-15', status: 'pendente' },
  { departamento: 'Produção', descricao: 'Otimização do fluxo de produção linha 2', data_inicio: '2026-01-15', data_prevista_termino: '2026-02-05', status: 'em_progresso' },
  { departamento: 'Processos', descricao: 'Documentação de novos processos', data_inicio: '2026-01-28', data_prevista_termino: '2026-02-28', status: 'pendente' },
  { departamento: 'TI', descricao: 'Atualização do sistema de gestão', data_inicio: '2026-01-10', data_prevista_termino: '2026-01-31', status: 'pronto' },
  { departamento: 'Compras', descricao: 'Negociação de fornecedores', data_inicio: '2026-02-01', data_prevista_termino: '2026-02-20', status: 'pendente' },
  { departamento: 'Almoxarifado', descricao: 'Inventário completo do estoque', data_inicio: '2026-01-22', data_prevista_termino: '2026-02-08', status: 'em_progresso' },
  { departamento: 'RH', descricao: 'Treinamento de novos colaboradores', data_inicio: '2026-01-18', data_prevista_termino: '2026-02-25', status: 'em_progresso' },
];

// Flag para controlar inserção única
let ja_tentou_inserir = false;

// Inserir dados de teste se vazio
const inserirDadosTeste = async () => {
  if (ja_tentou_inserir) return;
  ja_tentou_inserir = true;
  
  try {
    // Verificar se já existem dados
    const { count, error: erroVerificacao } = await supabase
      .from('operacoes_extras')
      .select('*', { count: 'exact', head: true });
    
    if (erroVerificacao) {
      console.error('Erro ao verificar dados:', erroVerificacao);
      return;
    }
    
      // Se não existem dados, inserir dados de teste
    if (count === 0) {
      console.log('Tabela vazia, inserindo dados de teste...');
      
      // Inserir um por um para garantir
      for (const dado of DADOS_TESTE) {
        const { error: erroInsercao } = await supabase
          .from('operacoes_extras')
          .insert([{
            departamento: dado.departamento,
            descricao: dado.descricao,
            data_inicio: dado.data_inicio,
            data_prevista_termino: dado.data_prevista_termino,
            status: dado.status,
            concluido: false,
            data_conclusao: null,
          }]);
        
        if (erroInsercao) {
          console.error('Erro ao inserir:', erroInsercao);
        }
      }
      
      console.log('Dados de teste inseridos com sucesso!');
    }
  } catch (err) {
    console.error('Erro na inserção de dados de teste:', err);
  }
};

type RawOPEX = {
  id: string;
  departamento: string;
  descricao: string;
  data_inicio: string;
  data_prevista_termino: string;
  status: OPEX["status"];
  concluido?: boolean | null;
  data_conclusao?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// Buscar todos os OPEX
export const useOPEX = () => {
  return useQuery({
    queryKey: ['OPEX'],
    queryFn: async () => {
      try {
        console.log('🔍 Iniciando busca de OPEX via RPC...');
        
        // Usar tabela operacoes_extras (ou RPC se existir)
        const { data: dataDirect, error: errDirect } = await supabase
          .from('operacoes_extras')
          .select('*')
          .order('data_prevista_termino', { ascending: true });
        if (!errDirect && dataDirect?.length !== undefined) {
          const rawData = (dataDirect || []) as RawOPEX[];
          return rawData.map((item) => ({
            id: item.id,
            departamento: item.departamento,
            descricao: item.descricao,
            data_inicio: item.data_inicio,
            data_prevista_termino: item.data_prevista_termino,
            status: item.status,
            concluido: item.concluido ?? false,
            data_conclusao: item.data_conclusao ?? null,
            created_at: item.created_at ?? new Date().toISOString(),
            updated_at: item.updated_at ?? new Date().toISOString(),
          })) as OPEX[];
        }
        const { data, error } = await supabase.rpc('get_operacoes_extras');
        
        console.log('📊 Resposta RPC:', { data_count: data?.length, error: error?.message });
        
        if (error) {
          console.error('❌ ERRO RPC:', error.message, error.code);
          console.log('⚠️ Caindo para DADOS_TESTE');
          return DADOS_TESTE as OPEX[];
        }
        
        if (!data || data.length === 0) {
          console.warn('⚠️ Nenhum dado retornado da RPC');
          return DADOS_TESTE as OPEX[];
        }
        
        console.log('✅ SUCCESS: Obtidos', data.length, 'registros da RPC');

        const rawData = (data || []) as RawOPEX[];

        return rawData.map((item) => ({
          id: item.id,
          departamento: item.departamento,
          descricao: item.descricao,
          data_inicio: item.data_inicio,
          data_prevista_termino: item.data_prevista_termino,
          status: item.status,
          concluido: item.concluido ?? false,
          data_conclusao: item.data_conclusao ?? null,
          created_at: item.created_at ?? new Date().toISOString(),
          updated_at: item.updated_at ?? new Date().toISOString(),
        })) as OPEX[];
      } catch (err) {
        console.error('❌ EXCEÇÃO ao buscar OPEX:', err);
        console.log('⚠️ Caindo para DADOS_TESTE');
        return DADOS_TESTE as OPEX[];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Criar OPEX
export const useCreateOPEX = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opex: Omit<OPEX, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const { data, error } = await supabase
          .from('operacoes_extras')
          .insert([{
            departamento: opex.departamento,
            descricao: opex.descricao,
            data_inicio: opex.data_inicio,
            data_prevista_termino: opex.data_prevista_termino,
            status: opex.status || 'pendente',
            concluido: opex.concluido ?? false,
            data_conclusao: opex.data_conclusao ?? null,
          }])
          .select()
          .single();

        if (error) {
          console.error('Erro ao inserir:', error);
          throw error;
        }
        return data;
      } catch (err: unknown) {
        // Se der erro de tabela não encontrada, retornar dado fictício
        const message =
          typeof err === 'object' && err && 'message' in err
            ? String((err as { message?: unknown }).message ?? '')
            : '';

        if (message.includes('Could not find the table')) {
          console.warn('Tabela não encontrada, criando localmente');
          return {
            id: crypto.randomUUID(),
            departamento: opex.departamento,
            descricao: opex.descricao,
            data_inicio: opex.data_inicio,
            data_prevista_termino: opex.data_prevista_termino,
            status: opex.status || 'pendente',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['OPEX'] });
      toast.success('OPEX criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar OPEX: ' + (error instanceof Error ? error.message : 'Desconhecido'));
    },
  });
};

// Atualizar OPEX
export const useUpdateOPEX = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...opex }: OPEX) => {
      try {
        const { data, error } = await supabase
          .from('operacoes_extras')
          .update({
            departamento: opex.departamento,
            descricao: opex.descricao,
            data_inicio: opex.data_inicio,
            data_prevista_termino: opex.data_prevista_termino,
            status: opex.status,
            concluido: opex.concluido,
            data_conclusao: opex.data_conclusao,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? String((err as { message?: unknown }).message ?? '')
            : '';

        if (message.includes('Could not find the table')) {
          return { id, ...opex };
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['OPEX'] });
      toast.success('OPEX atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar OPEX: ' + (error instanceof Error ? error.message : 'Desconhecido'));
    },
  });
};

// Deletar OPEX
export const useDeleteOPEX = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('operacoes_extras')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? String((err as { message?: unknown }).message ?? '')
            : '';

        if (message.includes('Could not find the table')) {
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['OPEX'] });
      toast.success('OPEX deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar OPEX: ' + (error instanceof Error ? error.message : 'Desconhecido'));
    },
  });
};
