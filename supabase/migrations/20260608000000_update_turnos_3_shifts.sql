-- Atualizar para 3 turnos: A 06:00-14:20, B 14:20-22:40, C 22:40-06:00
-- Remover Turno D

UPDATE public.turnos
SET nome = 'Turno A', hora_inicio = '06:00', hora_fim = '14:20'
WHERE nome IN ('Turno A', 'Manhã');

UPDATE public.turnos
SET nome = 'Turno B', hora_inicio = '14:20', hora_fim = '22:40'
WHERE nome IN ('Turno B', 'Tarde');

UPDATE public.turnos
SET nome = 'Turno C', hora_inicio = '22:40', hora_fim = '06:00'
WHERE nome IN ('Turno C', 'Noite');

DELETE FROM public.turnos WHERE nome = 'Turno D';
