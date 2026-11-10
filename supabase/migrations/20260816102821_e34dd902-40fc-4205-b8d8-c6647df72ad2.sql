INSERT INTO public.coupons (code, description, grants_pro, active)
VALUES ('rapidmathfreepro', 'Original launch code — grants Pro', true, true)
ON CONFLICT (code) DO NOTHING;