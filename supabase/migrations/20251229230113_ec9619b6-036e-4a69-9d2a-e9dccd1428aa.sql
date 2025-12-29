-- Add starred column for priority items
ALTER TABLE public.planner_items ADD COLUMN starred BOOLEAN NOT NULL DEFAULT false;