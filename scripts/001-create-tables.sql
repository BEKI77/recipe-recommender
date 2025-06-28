-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collections table
CREATE TABLE public.collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'from-purple-500 to-pink-500',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  cooking_time TEXT NOT NULL,
  servings INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  source_ingredients JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_recipes table for public recipe sharing
CREATE TABLE public.shared_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_recipes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Collections policies
CREATE POLICY "Users can view own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON public.collections
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Users can view recipes in their collections" ON public.recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = recipes.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view recipes in public collections" ON public.recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = recipes.collection_id 
      AND collections.is_public = TRUE
    )
  );

CREATE POLICY "Users can insert recipes in their collections" ON public.recipes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = recipes.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipes in their collections" ON public.recipes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = recipes.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipes in their collections" ON public.recipes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = recipes.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- Shared recipes policies
CREATE POLICY "Anyone can view active shared recipes" ON public.shared_recipes
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can insert their own shared recipes" ON public.shared_recipes
  FOR INSERT WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update their own shared recipes" ON public.shared_recipes
  FOR UPDATE USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete their own shared recipes" ON public.shared_recipes
  FOR DELETE USING (auth.uid() = shared_by);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(recipe_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.shared_recipes 
  SET view_count = view_count + 1 
  WHERE shared_recipes.recipe_id = increment_view_count.recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
