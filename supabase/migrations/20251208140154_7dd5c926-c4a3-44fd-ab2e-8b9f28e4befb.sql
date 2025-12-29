-- Criar tabela de produtos bloqueados
CREATE TABLE public.produtos_bloqueados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  turno_id UUID REFERENCES public.turnos(id),
  equipamento_id UUID REFERENCES public.equipamentos(id),
  motivo_bloqueio TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  numero_lacre TEXT,
  destino TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.produtos_bloqueados ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público
CREATE POLICY "Allow public read access on produtos_bloqueados" 
ON public.produtos_bloqueados 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on produtos_bloqueados" 
ON public.produtos_bloqueados 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on produtos_bloqueados" 
ON public.produtos_bloqueados 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on produtos_bloqueados" 
ON public.produtos_bloqueados 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_produtos_bloqueados_updated_at
BEFORE UPDATE ON public.produtos_bloqueados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_produtos_bloqueados_data ON public.produtos_bloqueados(data);
CREATE INDEX idx_produtos_bloqueados_turno ON public.produtos_bloqueados(turno_id);
CREATE INDEX idx_produtos_bloqueados_equipamento ON public.produtos_bloqueados(equipamento_id);