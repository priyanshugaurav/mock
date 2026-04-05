-- 1. QUESTIONS TABLE
CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    topic text NOT NULL,
    subtopic text,
    question text NOT NULL,
    options jsonb NOT NULL,
    correct_index integer NOT NULL,
    elo_rating integer DEFAULT 1200,
    latex_steps jsonb,
    average_time_sec integer DEFAULT 0,
    topper_time_sec integer DEFAULT 0,
    difficulty text,
    tags text[],
    ai_generated boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. QUESTION EDGES (Graph Structure)
CREATE TABLE public.question_edges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
    child_question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
    edge_type text, -- 'wrong_followup', 'correct_progression'
    weight float DEFAULT 1.0,
    created_at timestamptz DEFAULT now()
);

-- 3. USER QUESTION HISTORY
CREATE TABLE public.user_question_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
    is_correct boolean NOT NULL,
    time_taken_sec integer,
    user_elo_at_time integer,
    created_at timestamptz DEFAULT now()
);

-- 4. USER PROFILES (To track their current ELO)
-- Note: Assuming you might already have a profiles table, if not:
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    elo_rating integer DEFAULT 1200,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS (Optional but recommended)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

-- Simple policies for read-only access to questions for authenticated users
CREATE POLICY "Allow authenticated read access to questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to edges" ON public.question_edges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to view their own history" ON public.user_question_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own history" ON public.user_question_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
