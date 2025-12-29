-- Adicionar coluna capacidade_hora na tabela registros_producao
-- (o ciclo_ideal e ciclo_real serão mantidos por compatibilidade, mas não usados)
ALTER TABLE public.registros_producao 
ADD COLUMN IF NOT EXISTS capacidade_hora integer DEFAULT 100;

-- Atualizar registros existentes com a capacidade do equipamento
UPDATE public.registros_producao rp
SET capacidade_hora = COALESCE(e.capacidade_hora, 100)
FROM public.equipamentos e
WHERE rp.equipamento_id = e.id;