-- Add notes column to planner_items
ALTER TABLE public.planner_items ADD COLUMN notes TEXT DEFAULT NULL;