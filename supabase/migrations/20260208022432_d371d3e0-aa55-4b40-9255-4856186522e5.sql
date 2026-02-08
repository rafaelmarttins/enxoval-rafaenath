DROP POLICY IF EXISTS "Public can view gift list items" ON public.enxoval_items;
CREATE POLICY "Public can view gift list items"
ON public.enxoval_items
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (status = 'Não comprado');