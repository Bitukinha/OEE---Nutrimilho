-- Add or adjust Turno D schedule in shifts table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.turnos WHERE nome = 'Turno D') THEN
    -- update to correct hours if different
    UPDATE public.turnos
    SET hora_inicio = '19:00', hora_fim = '07:00'
    WHERE nome = 'Turno D' AND (hora_inicio <> '19:00' OR hora_fim <> '07:00');
  ELSE
    INSERT INTO public.turnos (nome, hora_inicio, hora_fim)
    VALUES ('Turno D', '19:00', '07:00');
  END IF;
END $$;
