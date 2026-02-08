-- 1) Nova coluna para reserva
ALTER TABLE public.enxoval_items
ADD COLUMN IF NOT EXISTS presenteado_por text;

-- 2) Política pública de leitura (recria com segurança)
DROP POLICY IF EXISTS "Public can view gift list items" ON public.enxoval_items;
CREATE POLICY "Public can view gift list items"
ON public.enxoval_items
FOR SELECT
TO anon, authenticated
USING (status = 'Não comprado');

-- 3) Função segura para reservar item sem login
CREATE OR REPLACE FUNCTION public.reserve_enxoval_item(p_item_id uuid, p_nome text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text;
  v_updated integer;
BEGIN
  v_nome := trim(coalesce(p_nome, ''));

  IF length(v_nome) < 1 OR length(v_nome) > 60 THEN
    RAISE EXCEPTION 'Nome inválido' USING ERRCODE = '22023';
  END IF;

  UPDATE public.enxoval_items
     SET presenteado_por = v_nome,
         updated_at = now()
   WHERE id = p_item_id
     AND status = 'Não comprado'
     AND presenteado_por IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_enxoval_item(uuid, text) TO anon, authenticated;