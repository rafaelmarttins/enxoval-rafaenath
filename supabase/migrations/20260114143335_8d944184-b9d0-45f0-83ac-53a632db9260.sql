-- Enable realtime for enxoval_items table
alter table public.enxoval_items replica identity full;

alter publication supabase_realtime add table public.enxoval_items;