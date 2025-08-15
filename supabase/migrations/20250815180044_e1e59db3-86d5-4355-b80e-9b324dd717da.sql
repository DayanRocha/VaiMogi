-- Enable RLS on spatial_ref_sys table
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read spatial reference systems
-- This table contains public coordinate system definitions needed for spatial operations
CREATE POLICY "Allow authenticated users to read spatial reference systems"
ON public.spatial_ref_sys
FOR SELECT
TO authenticated
USING (true);

-- Add comment explaining the security model
COMMENT ON TABLE public.spatial_ref_sys IS 'PostGIS spatial reference systems table - contains public coordinate system definitions';