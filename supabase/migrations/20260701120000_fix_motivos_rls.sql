-- Garantir que motivos de parada e bloqueios aceitem CRUD via RLS
ALTER TABLE public.motivos_paradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivos_bloqueios ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'motivos_paradas'
      AND policyname = 'Allow public insert on motivos_paradas'
  ) THEN
    CREATE POLICY "Allow public insert on motivos_paradas"
      ON public.motivos_paradas
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'motivos_paradas'
      AND policyname = 'Allow public update on motivos_paradas'
  ) THEN
    CREATE POLICY "Allow public update on motivos_paradas"
      ON public.motivos_paradas
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'motivos_paradas'
      AND policyname = 'Allow public delete on motivos_paradas'
  ) THEN
    CREATE POLICY "Allow public delete on motivos_paradas"
      ON public.motivos_paradas
      FOR DELETE
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'motivos_bloqueios'
      AND policyname = 'Allow public insert on motivos_bloqueios'
  ) THEN
    CREATE POLICY "Allow public insert on motivos_bloqueios"
      ON public.motivos_bloqueios
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'motivos_bloqueios'
      AND policyname = 'Allow public update on motivos_bloqueios'
  ) THEN
    CREATE POLICY "Allow public update on motivos_bloqueios"
      ON public.motivos_bloqueios
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'motivos_bloqueios'
      AND policyname = 'Allow public delete on motivos_bloqueios'
  ) THEN
    CREATE POLICY "Allow public delete on motivos_bloqueios"
      ON public.motivos_bloqueios
      FOR DELETE
      USING (true);
  END IF;
END $$;
