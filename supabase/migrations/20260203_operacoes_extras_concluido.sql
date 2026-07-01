-- Adicionar colunas concluido e data_conclusao em operacoes_extras
ALTER TABLE public.operacoes_extras
  ADD COLUMN IF NOT EXISTS concluido BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMP WITH TIME ZONE;

-- Atualizar RPC get_operacoes_extras para retornar concluido e data_conclusao
CREATE OR REPLACE FUNCTION public.get_operacoes_extras()
RETURNS TABLE (
  id UUID,
  departamento TEXT,
  descricao TEXT,
  data_inicio DATE,
  data_prevista_termino DATE,
  status TEXT,
  concluido BOOLEAN,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY SELECT
    o.id,
    o.departamento,
    o.descricao,
    o.data_inicio,
    o.data_prevista_termino,
    o.status,
    COALESCE(o.concluido, false),
    o.data_conclusao,
    o.created_at,
    o.updated_at
  FROM public.operacoes_extras o
  ORDER BY o.data_prevista_termino ASC;
END;
$$ LANGUAGE plpgsql;
