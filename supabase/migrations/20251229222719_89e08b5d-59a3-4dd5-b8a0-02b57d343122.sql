-- Create planner_items table for Kanban board
CREATE TABLE public.planner_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea' CHECK (stage IN ('idea', 'tomorrow', 'special')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (but allow all operations since no auth required)
ALTER TABLE public.planner_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anyone can CRUD)
CREATE POLICY "Anyone can view planner items" 
ON public.planner_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create planner items" 
ON public.planner_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update planner items" 
ON public.planner_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete planner items" 
ON public.planner_items 
FOR DELETE 
USING (true);