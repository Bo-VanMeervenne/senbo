-- Add board column to distinguish between SenBo and Senne planners
ALTER TABLE public.planner_items ADD COLUMN board TEXT NOT NULL DEFAULT 'senbo' CHECK (board IN ('senbo', 'senne'));