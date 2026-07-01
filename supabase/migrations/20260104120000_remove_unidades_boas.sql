-- Remover coluna unidades_boas e recalcular fórmulas de qualidade
-- Agora qualidade será calculada com base em defeitos e produtos bloqueados

-- Verificar e remover a coluna unidades_boas se ela existir
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='registros_producao' AND column_name='unidades_boas'
    ) THEN 
        ALTER TABLE public.registros_producao DROP COLUMN unidades_boas; 
    END IF; 
END $$;

-- Atualizar a fórmula de qualidade para considerar apenas defeitos
-- qualidade = (total_produzido - defeitos) / total_produzido * 100
-- A qualidade também será afetada por produtos bloqueados (calculado no frontend)

-- Recalcular a coluna OEE com a nova lógica
-- A fórmula permanece a mesma: (disponibilidade * performance * qualidade) / 10000
-- Mas agora qualidade = (total_produzido - defeitos) / total_produzido

-- Nota: O cálculo de qualidade agora deve levar em conta:
-- 1. Defeitos no registro de produção
-- 2. Produtos bloqueados na tabela produtos_bloqueados
-- 
-- A qualidade será recalculada no frontend consultando:
-- - registros_producao.defeitos
-- - produtos_bloqueados.quantidade para a mesma data/turno/equipamento
