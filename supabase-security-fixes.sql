-- ============================================================================
-- ONSITE ANALYTICS - SECURITY FIXES (RLS Policy Remediation)
-- ============================================================================
-- Generated: 2026-01-27
-- Source: CLAUDE.md Security Audit
-- Execute in: Supabase SQL Editor (https://supabase.com/dashboard)
--
-- IMPORTANT: Run this in a single transaction. If any statement fails,
-- the entire migration is rolled back safely.
-- ============================================================================

BEGIN;

-- ============================================================================
-- P0 - CRITICAL: pending_tokens (SELECT open to anyone including anon)
-- ============================================================================
-- PROBLEM: Policy "Anyone can read token" uses qual=true, allowing anyone
-- (including anonymous users) to list ALL pending QR tokens.
-- FIX: Remove open SELECT. Owner can manage own tokens. Token lookup
-- is done via a SECURITY DEFINER function (safe, no row enumeration).
-- ============================================================================

-- Drop the dangerous open SELECT policy
DROP POLICY IF EXISTS "Anyone can read token" ON public.pending_tokens;

-- Owner can do everything with their own tokens
DROP POLICY IF EXISTS "Owner can manage own tokens" ON public.pending_tokens;
CREATE POLICY "Owner can manage own tokens"
  ON public.pending_tokens
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Secure function for QR code scanning (viewer looks up by token value)
-- This avoids exposing the table via SELECT policy
CREATE OR REPLACE FUNCTION public.lookup_pending_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  owner_name TEXT,
  token VARCHAR,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return non-expired tokens
  RETURN QUERY
  SELECT pt.id, pt.owner_id, pt.owner_name, pt.token, pt.expires_at
  FROM public.pending_tokens pt
  WHERE pt.token = p_token
    AND pt.expires_at > NOW();
END;
$$;

-- Grant execute to authenticated users only (not anon)
REVOKE ALL ON FUNCTION public.lookup_pending_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lookup_pending_token(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.lookup_pending_token(TEXT) TO authenticated;

-- ============================================================================
-- P1 - HIGH: app_logs (INSERT open to anyone with spoofed user_ids)
-- ============================================================================
-- PROBLEM: Policy "Anyone can insert logs" uses WITH CHECK (true) with
-- role {public}, allowing anyone to insert logs with fake user_ids.
-- FIX: Restrict to authenticated users, enforce user_id = auth.uid().
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can insert logs" ON public.app_logs;

-- Only allow own SELECT
DROP POLICY IF EXISTS "Users can view own app_logs" ON public.app_logs;
CREATE POLICY "Users can view own app_logs"
  ON public.app_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can only insert their own logs
DROP POLICY IF EXISTS "Users can insert own app_logs" ON public.app_logs;
CREATE POLICY "Users can insert own app_logs"
  ON public.app_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- P1 - HIGH: core_profiles (INSERT allows auth.uid() IS NULL)
-- ============================================================================
-- PROBLEM: INSERT policy allows unauthenticated users to create profiles.
-- FIX: Require auth.uid() = id (profile id must match auth user id).
-- ============================================================================

-- Drop existing INSERT policies (common names)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.core_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.core_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.core_profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.core_profiles;

-- Recreate: must be authenticated and id must match auth.uid()
CREATE POLICY "Users can insert own profile"
  ON public.core_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- P1 - HIGH: checkout_codes (RLS enabled, zero policies = locked)
-- ============================================================================
-- PROBLEM: Table has RLS enabled but no policies, making it completely
-- inaccessible even to legitimate users.
-- FIX: Users can read/update own codes. Insert via service role only.
-- ============================================================================

-- Users can view their own checkout codes
CREATE POLICY "Users can view own checkout_codes"
  ON public.checkout_codes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can mark their own codes as used
CREATE POLICY "Users can update own checkout_codes"
  ON public.checkout_codes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: INSERT is done via service_role (server-side) or generate_checkout_code function
-- No INSERT policy needed for client-side access

-- ============================================================================
-- P2 - MEDIUM: Log tables using {public} role instead of {authenticated}
-- ============================================================================
-- PROBLEM: Policies on log_errors, log_events, log_voice use role {public}
-- allowing anonymous users to insert/read log data.
-- FIX: Restrict all log policies to {authenticated} role.
-- ============================================================================

-- ---- log_errors ----
DROP POLICY IF EXISTS "Users can insert errors" ON public.log_errors;
DROP POLICY IF EXISTS "Users can view own errors" ON public.log_errors;
DROP POLICY IF EXISTS "Anyone can insert errors" ON public.log_errors;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.log_errors;
DROP POLICY IF EXISTS "Enable select for users" ON public.log_errors;

CREATE POLICY "Authenticated users can insert own errors"
  ON public.log_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Authenticated users can view own errors"
  ON public.log_errors
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ---- log_events ----
DROP POLICY IF EXISTS "Users can insert events" ON public.log_events;
DROP POLICY IF EXISTS "Users can view own events" ON public.log_events;
DROP POLICY IF EXISTS "Anyone can insert events" ON public.log_events;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.log_events;
DROP POLICY IF EXISTS "Enable select for users" ON public.log_events;

CREATE POLICY "Authenticated users can insert own events"
  ON public.log_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Authenticated users can view own events"
  ON public.log_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ---- log_voice ----
DROP POLICY IF EXISTS "Users can insert voice logs" ON public.log_voice;
DROP POLICY IF EXISTS "Users can view own voice logs" ON public.log_voice;
DROP POLICY IF EXISTS "Anyone can insert voice logs" ON public.log_voice;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.log_voice;
DROP POLICY IF EXISTS "Enable select for users" ON public.log_voice;

CREATE POLICY "Authenticated users can insert own voice_logs"
  ON public.log_voice
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Authenticated users can view own voice_logs"
  ON public.log_voice
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ---- log_locations ----
-- (Already uses own data only, but fix role from {public} to {authenticated})
DROP POLICY IF EXISTS "Users can manage own locations" ON public.log_locations;
DROP POLICY IF EXISTS "Users can insert locations" ON public.log_locations;
DROP POLICY IF EXISTS "Users can view own locations" ON public.log_locations;
DROP POLICY IF EXISTS "Enable all for users" ON public.log_locations;

CREATE POLICY "Authenticated users can manage own locations"
  ON public.log_locations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- P2 - MEDIUM: app_timekeeper_projects (missing shared-access policy)
-- ============================================================================
-- PROBLEM: Viewer with an active access_grant cannot see owner's projects,
-- unlike entries and geofences which already have shared-access policies.
-- FIX: Add SELECT policy for viewers via access_grants (same pattern as
-- app_timekeeper_entries and app_timekeeper_geofences).
-- ============================================================================

CREATE POLICY "Viewer can see shared projects"
  ON public.app_timekeeper_projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_grants ag
      WHERE ag.owner_id = app_timekeeper_projects.user_id
        AND ag.viewer_id = auth.uid()
        AND ag.status = 'active'
    )
  );

-- ============================================================================
-- P3 - LOW: Functions missing search_path
-- ============================================================================
-- PROBLEM: 4 functions don't have search_path set, which can be a security
-- risk if a malicious schema is placed before public in the search path.
-- FIX: Set search_path = public on all 4 functions.
-- ============================================================================

-- Note: Using DO block to handle cases where function signatures might vary
DO $$
BEGIN
  -- update_updated_at_column
  BEGIN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_updated_at_column() not found, skipping';
  END;

  -- calculate_entry_duration
  BEGIN
    ALTER FUNCTION public.calculate_entry_duration() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function calculate_entry_duration() not found, skipping';
  END;

  -- cleanup_expired_checkout_codes
  BEGIN
    ALTER FUNCTION public.cleanup_expired_checkout_codes() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function cleanup_expired_checkout_codes() not found, skipping';
  END;

  -- generate_checkout_code
  -- This function likely takes parameters, trying common signatures
  BEGIN
    ALTER FUNCTION public.generate_checkout_code() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN
    BEGIN
      ALTER FUNCTION public.generate_checkout_code(UUID, TEXT) SET search_path = public;
    EXCEPTION WHEN undefined_function THEN
      BEGIN
        ALTER FUNCTION public.generate_checkout_code(UUID, TEXT, TEXT) SET search_path = public;
      EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'Function generate_checkout_code() not found with any known signature, skipping';
      END;
    END;
  END;
END;
$$;

-- ============================================================================
-- P3 - LOW: PostGIS in public schema
-- ============================================================================
-- PROBLEM: PostGIS extension is installed in public schema instead of
-- extensions schema.
--
-- NOTE: Moving PostGIS between schemas is a DESTRUCTIVE operation that can
-- break existing queries and functions. This should be done manually with
-- careful testing. Steps:
--
--   1. CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
--   2. DROP EXTENSION postgis;  -- from public
--   3. Test all location-related queries
--
-- Skipping automatic migration — requires manual intervention and testing.
-- ============================================================================

-- ============================================================================
-- P3 - LOW: Auth - Leaked password protection (HaveIBeenPwned)
-- ============================================================================
-- PROBLEM: HaveIBeenPwned leaked password protection is disabled.
--
-- NOTE: This is a Supabase Dashboard setting, not SQL.
-- Go to: Authentication > Settings > Security
-- Enable: "Leaked Password Protection"
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to confirm)
-- ============================================================================
-- Uncomment and run these to verify the policies are correct:
--
-- -- List all policies for affected tables
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN (
--   'pending_tokens', 'app_logs', 'core_profiles', 'checkout_codes',
--   'log_errors', 'log_events', 'log_voice', 'log_locations',
--   'app_timekeeper_projects'
-- )
-- ORDER BY tablename, policyname;
--
-- -- Verify no policies use {public} role on log tables
-- SELECT tablename, policyname, roles
-- FROM pg_policies
-- WHERE tablename LIKE 'log_%'
--   AND roles @> ARRAY['public']::name[];
--
-- -- Verify pending_tokens has no open SELECT
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'pending_tokens'
--   AND cmd = 'SELECT';
--
-- -- Verify lookup function exists
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE proname = 'lookup_pending_token';
