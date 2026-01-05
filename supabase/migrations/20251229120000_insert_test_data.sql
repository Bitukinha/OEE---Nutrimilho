-- Inserir dados de teste de produção para hoje
-- Este arquivo garante que há dados para demonstração

INSERT INTO public.registros_producao 
  (data, equipamento_id, turno_id, tempo_planejado, tempo_real, tempo_ciclo_ideal, 
   tempo_ciclo_real, total_produzido, unidades_boas, defeitos, capacidade_hora)
SELECT 
  CURRENT_DATE as data,
  e.id,
  t.id,
  480 as tempo_planejado,
  450 as tempo_real,
  2.5 as tempo_ciclo_ideal,
  2.4 as tempo_ciclo_real,
  180 as total_produzido,
  175 as unidades_boas,
  5 as defeitos,
  e.capacidade_hora
FROM public.equipamentos e
CROSS JOIN public.turnos t
WHERE NOT EXISTS (
  SELECT 1 FROM public.registros_producao 
  WHERE data = CURRENT_DATE 
    AND equipamento_id = e.id 
    AND turno_id = t.id
);

-- Inserir dados de teste de paradas para hoje
INSERT INTO public.paradas 
  (data, turno_id, equipamento_id, duracao, motivo, categoria)
SELECT 
  CURRENT_DATE as data,
  t.id,
  e.id,
  30 as duracao,
  'Manutenção preventiva' as motivo,
  'manutencao' as categoria
FROM public.turnos t
CROSS JOIN public.equipamentos e
WHERE NOT EXISTS (
  SELECT 1 FROM public.paradas 
  WHERE data = CURRENT_DATE 
    AND turno_id = t.id 
    AND equipamento_id = e.id
    AND motivo = 'Manutenção preventiva'
)
LIMIT 4; -- Apenas alguns registros de exemplo

-- Inserir dados de teste de produtos bloqueados para hoje
INSERT INTO public.produtos_bloqueados 
  (data, turno_id, equipamento_id, motivo_bloqueio, quantidade, destino)
SELECT 
  CURRENT_DATE as data,
  t.id,
  e.id,
  'Desvio de especificação' as motivo_bloqueio,
  5 as quantidade,
  'Descarte' as destino
FROM public.turnos t
CROSS JOIN public.equipamentos e
WHERE NOT EXISTS (
  SELECT 1 FROM public.produtos_bloqueados 
  WHERE data = CURRENT_DATE 
    AND turno_id = t.id 
    AND equipamento_id = e.id
)
LIMIT 2; -- Apenas alguns registros de exemplo
