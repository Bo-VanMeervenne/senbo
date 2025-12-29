-- Replace starred boolean with priority integer (1-10, NULL = no priority)
ALTER TABLE public.planner_items DROP COLUMN starred;
ALTER TABLE public.planner_items ADD COLUMN priority INTEGER DEFAULT NULL CHECK (priority IS NULL OR (priority >= 1 AND priority <= 10));