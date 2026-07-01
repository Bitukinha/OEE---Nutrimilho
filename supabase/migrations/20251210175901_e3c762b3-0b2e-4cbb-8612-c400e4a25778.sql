-- Adicionar coluna de meta OEE na tabela turnos
ALTER TABLE public.turnos 
ADD COLUMN meta_oee numeric NOT NULL DEFAULT 85;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.turnos.meta_oee IS 'Meta de OEE em percentual para o turno';