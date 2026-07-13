-- Migration: Security hardening for cross-tenant access at the DB boundary
-- Addresses three issues where the public anon key could reach other users'
-- data or degrade their service:
--   1. get_upcoming_renewals (SECURITY DEFINER) trusted a caller-supplied
--      p_user_id with no auth check  -> cross-tenant data leak via RPC.
--   2. api_rate_limits RLS applied to all roles -> users could reset their own
--      limits or lock out other users.
--   3. recommendations / contract_analyses INSERT policies used WITH CHECK(true)
--      for all roles -> any user could forge rows for an arbitrary user_id.
-- The API and edge functions use the service key (service_role, which bypasses
-- RLS), so scoping these policies to service_role does not affect legitimate flows.

-- ---------------------------------------------------------------------------
-- 1. get_upcoming_renewals: enforce that callers can only read their own rows.
--    The service key (used by the send-reminders edge function) is exempt so
--    scheduled reminder emails keep working.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_upcoming_renewals(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    id UUID,
    provider_name TEXT,
    contract_type TEXT,
    end_date DATE,
    next_renewal_date DATE,
    monthly_cost DECIMAL(10,2),
    currency TEXT
) AS $$
BEGIN
    -- Block cross-tenant access: a non-service caller may only query itself.
    IF auth.role() <> 'service_role'
       AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
        RAISE EXCEPTION 'Not authorized to read renewals for another user';
    END IF;

    RETURN QUERY
    SELECT
        c.id,
        c.provider_name,
        c.contract_type,
        c.end_date,
        c.next_renewal_date,
        c.monthly_cost,
        c.currency
    FROM contracts c
    WHERE c.user_id = p_user_id
      AND c.next_renewal_date IS NOT NULL
      AND c.next_renewal_date <= CURRENT_DATE + (p_days || ' days')::INTERVAL
      AND c.next_renewal_date >= CURRENT_DATE
    ORDER BY c.next_renewal_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. api_rate_limits: restrict to the service role only. The API reads/writes
--    this table exclusively with the service key.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access" ON api_rate_limits;
CREATE POLICY "Service role full access" ON api_rate_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. recommendations / contract_analyses: scope the insert policies to the
--    service role so users cannot forge rows for arbitrary user_ids.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can insert recommendations" ON recommendations;
CREATE POLICY "Service role can insert recommendations" ON recommendations
    FOR INSERT
    TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert analyses" ON contract_analyses;
CREATE POLICY "Service role can insert analyses" ON contract_analyses
    FOR INSERT
    TO service_role
    WITH CHECK (true);
