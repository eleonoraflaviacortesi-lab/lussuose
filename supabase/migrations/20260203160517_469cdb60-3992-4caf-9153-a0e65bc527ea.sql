-- Create a security definer function to check if users are in the same sede
CREATE OR REPLACE FUNCTION public.is_same_sede(_user_id uuid, _notizia_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p1, profiles p2
    WHERE p1.user_id = _user_id
      AND p2.user_id = _notizia_user_id
      AND (p1.sede = p2.sede OR p2.sede = ANY(COALESCE(p1.sedi, '{}')))
  )
$$;

-- Add policy for viewing notizie of same sede users (for meetings)
CREATE POLICY "Users can view notizie of same sede for meetings"
ON public.notizie
FOR SELECT
USING (
  public.is_same_sede(auth.uid(), user_id)
);