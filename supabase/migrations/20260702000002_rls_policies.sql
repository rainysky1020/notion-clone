ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_history ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- pages
CREATE POLICY pages_select_own ON public.pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY pages_insert_own ON public.pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY pages_update_own ON public.pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY pages_delete_own ON public.pages
  FOR DELETE USING (auth.uid() = user_id);

-- blocks (via page ownership)
CREATE POLICY blocks_select_own ON public.blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY blocks_insert_own ON public.blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY blocks_update_own ON public.blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY blocks_delete_own ON public.blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()
    )
  );

-- page_history
CREATE POLICY page_history_select_own ON public.page_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY page_history_insert_own ON public.page_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY page_history_delete_own ON public.page_history
  FOR DELETE USING (auth.uid() = user_id);
