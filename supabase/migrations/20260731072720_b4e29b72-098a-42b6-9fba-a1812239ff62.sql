REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_org_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.org_role(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_org_permission(UUID, public.app_permission) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_permission(UUID, public.app_permission) TO authenticated;