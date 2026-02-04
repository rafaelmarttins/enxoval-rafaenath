-- Enforce quantidade_adquirida when status is Comprado/Presenteado

CREATE OR REPLACE FUNCTION public.validate_enxoval_items_quantidade_adquirida()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('Comprado', 'Presenteado') THEN
    IF NEW.quantidade_adquirida IS NULL OR NEW.quantidade_adquirida < 1 THEN
      RAISE EXCEPTION 'quantidade_adquirida deve ser >= 1 quando status for %', NEW.status
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_enxoval_items_quantidade_adquirida ON public.enxoval_items;

CREATE TRIGGER trg_validate_enxoval_items_quantidade_adquirida
BEFORE INSERT OR UPDATE OF status, quantidade_adquirida
ON public.enxoval_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_enxoval_items_quantidade_adquirida();
