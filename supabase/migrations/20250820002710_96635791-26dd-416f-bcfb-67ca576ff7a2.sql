-- Create user roles table (separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID DEFAULT auth.uid())
RETURNS app_role[]
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(role) 
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Update RLS policies to use the new role system
DROP POLICY IF EXISTS "Analysts and admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Analysts and admins can manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Analysts and admins can manage licenses" ON public.licenses;

CREATE POLICY "Analysts and admins can manage companies" 
ON public.companies 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'analyst') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Analysts and admins can manage contacts" 
ON public.contacts 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'analyst') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Analysts and admins can manage licenses" 
ON public.licenses 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'analyst') OR public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role 
FROM public.profiles 
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove role column from profiles (keep the table for other profile data)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;